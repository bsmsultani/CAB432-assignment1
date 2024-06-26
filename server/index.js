const express = require('express');
const fs = require('fs');
const cors = require('cors');
const Story = require('./story/story');
const { returnListLanguages } = require('./story/translate');
const VoiceOver = require('./story/voice');
const CombineAudio = require('./story/audioGen');
const { updateObjectInS3 } = require('./awsCounter');


const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());
app.use(express.json()); // Middleware to parse JSON in the request body

app.use(express.static(`${__dirname}/story/movies`))

app.get('/', async (req, res) => {
  // go to the story.movies and get 10 movies, their names, and their ids

  let movies = fs.readdirSync(`${__dirname}/story/movies`);

  // select 10 random movies
  movies = movies.sort(() => Math.random() - Math.random()).slice(0, 10);

  const movieData = movies.map((movie) => {
    const movieId = movie;
    // timeout 1 second to wait for the files to be written

    const movieName = Story.getTitle(fs.readFileSync(`${__dirname}/story/movies/${movie}/script.txt`, 'utf8'));
    const movieTheme = Story.getTheme(fs.readFileSync(`${__dirname}/story/movies/${movie}/script.txt`, 'utf8'));

    // Create an object with movie data
    return { movieId, movieName, movieTheme };
  });
  

  const { counter } = await updateObjectInS3();

  // Send back an array of objects as JSON
  res.send({ movieData, counter });
});


// create a new story and send back the id of the story so the user can be redirected to the story page
app.post('/create', async (req, res) => {
  try {
    const { storyAbout } = req.body;
    // if the storyAbout is empty, send an error

    if (!storyAbout) {
      res.status(400).send({ error: 'Story about is empty' });
      return;
    }

    if (storyAbout.length > 1000) {
      res.status(400).send({ error: 'Story about is too long' });
      return;
    }

    const story = new Story();
    await story.generate(storyAbout);

    if (!story.success) {
      throw new Error('Story generation failed');
    }

    res.send({ movieId: story.movieId });

  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'Story generation failed' });
  }
});


// get the story data from the story id
app.get('/story/:id', async (req, res) => {
  console.log('GET /story/:id');
  try {
    const { id } = req.params;

    const { title, theme, content } = Story.readFromFile(id);

    const languages = await returnListLanguages();

    const storyData = {
      title,
      theme,
      content,
      languages,
    };

    res.send(storyData);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'Failed to retrieve story data' });
  }
});

// get the story data from the story id and language code

app.get('/story/:id/:languageCode', async (req, res) => {
  console.log('GET /story/:id/:languageCode');
  try {
    const { id, languageCode } = req.params;

    const { title, theme, content } = await Story.translateFromFile(id, languageCode);    
    

    const languages = await returnListLanguages();

    const storyData = {
      title,
      theme,
      content,
      languages,
    };

    res.send(storyData);

  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'Failed to retrieve story data' });
  }
});

// get the audio from the story id


app.get('/voice/:id/:languageCode', async (req, res) => {
  const { id, languageCode } = req.params;
  const AudioPath = `${__dirname}/story/movies/${id}/audio`;
  const output = `${__dirname}/story/movies/${id}/${languageCode}-audio.mp3`;
  const folderPath = `${__dirname}/story/movies/${id}`;

  try {
    await VoiceOver.initialise_voices();

    const languageAudioExists = async () => {
      try {
        const files = await fs.readdirSync(folderPath);
        return files.some(file => file.endsWith('.mp3') && file.startsWith(languageCode));
      } catch (e) {
        console.error(e);
        return false;
      }
    };

    if (await languageAudioExists()) {
      // Language audio already exists, send a success response
      res.status(200).send({ success: true });
    } else {
      if (languageCode === 'en') {
        const { title, theme, content } = Story.readFromFile(id);
        const story = new Story();
        story.movieId = id;
        story.title = title;
        story.theme = theme;
        story.story = content;
        story.fillVoiceQueue();
        await story.AudioGen();
        await CombineAudio(AudioPath, output);
        res.status(200).send({ success: true });
      } else {
        // Language audio does not exist, generate it
        try {
          const { title, theme, content } = Story.readFromFile(id);
          const story = new Story();
          story.movieId = id;
          story.title = title;
          story.theme = theme;
          story.story = content;
          story.fillVoiceQueue();
          await story.translateAudio(languageCode);
          await story.AudioGen();
          await CombineAudio(AudioPath, output);
          // Send a success response
          res.status(200).send({ success: true });
        } catch (e) {
          console.error(e);
          // Send an error response if there is an exception
          res.status(500).send({ error: 'Internal server error' });
        }
      }
    }
  } catch (e) {
    console.error(e);
    // Send an error response if there is an exception at the top level
    res.status(500).send({ error: 'Internal server error' });
  }
});


// show Path does not exist if the user tries to go to a path that does not exist

app.get('*', (req, res) => {
  res.status(404).send({ error: 'Page not found.' });
});




app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

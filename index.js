const express = require('express');
const fs = require('fs');
const cors = require('cors');
const Story = require('./story/story');
const { returnListLanguages } = require('./story/translate');
const VoiceOver = require('./story/voice');
const CombineAudio = require('./story/audioGen');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json()); // Middleware to parse JSON in the request body

app.use(express.static(`${__dirname}/story/movies`))

app.get('/', (req, res) => {
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
  

  // Send back an array of objects as JSON
  res.send(movieData);
});



app.post('/create', async (req, res) => {
  try {
    const { storyAbout } = req.body;
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

app.get('/story/:id/:languageCode', async (req, res) => {
  console.log('GET /story/:id/:languageCode');
  try {
    const { id, languageCode } = req.params;

    let languageSupported = false;
    const FolderPath = `${__dirname}/story/movies/${id}/audio`;
    const output = `${__dirname}/story/movies/${id}/${languageCode}-output.mp3`;

    const getLanguageAudio = async (languageCode) => {
      try {
        const { title, theme, content } = Story.readFromFile(id);
        await VoiceOver.initialise_voices();
        const story = new Story();
        story.movieId = id;
        story.title = title;
        story.theme = theme;
        story.story = content;
        story.fillVoiceQueue();
        await story.translateAudio(languageCode);
        await story.AudioGen();
        console.log(output);
        // timeout to wait for the files to be written
        setTimeout(() => {
          CombineAudio(FolderPath, output);
        }, 3000);

      } catch (e) {
        console.error(e);
        languageSupported = true;
      }
    }

    const languageAudioExists = () => {
      // read the files in FolderPath that end with .mp3 and check if starts with languageCode
      const files = fs.readdirSync(FolderPath);
      const languageAudioExists = files.some(file => file.endsWith('.mp3') && file.startsWith(languageCode));
      return languageAudioExists;
    }

    if (!languageAudioExists()) {
      await getLanguageAudio(languageCode);
    }

    const { title, theme, content } = Story.translateFromFile(id, languageCode);    

    const languages = await returnListLanguages();

    const storyData = {
      title,
      theme,
      content,
      languages,
      languageSupported,
    };

    res.send(storyData);

  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'Failed to retrieve story data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

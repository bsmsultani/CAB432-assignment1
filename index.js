const express = require('express');
const fs = require('fs');
const cors = require('cors');

const Story = require('./story/story');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json()); // Middleware to parse JSON in the request body

app.use(express.static(`${__dirname}/story/movies`))

app.get('/', (req, res) => {
  // go to the story.movies and get 10 movies, their names, and their ids

  const movies = fs.readdirSync(`${__dirname}/story/movies`);

  const movieData = movies.map((movie) => {
    const movieId = movie;
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

    console.log('id', id);

    // Read the story script
    const scriptPath = `${__dirname}/story/movies/${id}/script.txt`;
    const script = fs.readFileSync(scriptPath, 'utf8');

    const title = Story.getTitle(script);
    const theme = Story.getTheme(script);
    const content = Story.getStory(script);


    // get audio file

    const audioPath = `${__dirname}/story/movies/${id}/audio.mp3`;

    // Read the audio file

    const audio = fs.readFileSync(audioPath);

    // Send back the story data

    const storyData = {
      title,
      theme,
      content,
      audio,
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

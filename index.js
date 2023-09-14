const express = require('express');
const fs = require('fs');
const cors = require('cors');

const Story = require('./story/story');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json()); // Middleware to parse JSON in the request body

app.post('/create', async (req, res) => {
  try {
    const { storyAbout } = req.body;
    const story = new Story();
    await story.generate(storyAbout);

    if (!story.success) {
      throw new Error('Story generation failed');
    }

    res.redirect(`/story/${story.id}`);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'Story generation failed' });
  }
});



app.get('/story/:id', async (req, res) => {
  console.log('GET /story/:id');
  try {
    const { id } = req.params;

    // Read the story script
    const scriptPath = `${__dirname}/story/movies/${id}/script.txt`;
    const script = fs.readFileSync(scriptPath, 'utf8');

    const title = Story.getTitle(script);
    const theme = Story.getTheme(script);
    const content = Story.getStory(script);

    const storyData = {
      title,
      theme,
      content,
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

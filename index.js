const Story = require('./story/story');

(async () => {
    const story = new Story();
    await story.initialize("a war between robots and humans");

    if (story.success) {
        story.AudioGen();
        story.ImageGen();
    }
})();
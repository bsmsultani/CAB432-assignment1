const Story = require('./story/story');

(async () => {
    const story = new Story();
    story.about("a person who is a programmer");
})();
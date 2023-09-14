const VoiceOver = require('./voice');
const generate_script = require('./generate_script');
const generate_image = require('./image_gen');
const fs = require('fs');
const { promiseHooks } = require('v8');

class Story {
    static getTitle(script) {
        const titleReg = /Title:\s*(.*)/;
        const title = script.match(titleReg);
        if (!title) {
            throw new Error('No title found');
        }
        const titleText = title[1];
        return titleText;
    }

    static getTheme(script) {
        const themeReg = /Theme:\s*(.*)/;
        const theme = script.match(themeReg);
        if (!theme) {
            throw new Error('No theme found');
        }
        const themeText = theme[1];
        return themeText;
    }

    static getStory(script) {
        const storyReg = /Theme:.*\n([\s\S]*)/;
        const story = script.match(storyReg);
        if (!story) {
            throw new Error('No story found');
        }
        const storyText = story[1];
        return storyText.split('\n').filter(line => line !== '');
    }

    static getCharacterText(line) {
        const characterTextReg = /(.*):(.*)/;
        const characterTextMatch = line.match(characterTextReg);

        if (!characterTextMatch) {
            throw new Error(`No character text found in line: ${line}`);
        }
        const characterName = characterTextMatch[1].trim();
        const characterLine = characterTextMatch[2].trim();
        return { characterName, characterLine };
    }

    constructor() {
        this.queue = [];
        this.characterVoice = {};
        this.imageQueue = [];
    }

    // The main logic of the story generation
    async initialize(about) {
        console.log(about);
        this.success = false; // If the story generation was successful. i.e. if the story format was correct

        // Try to generate a story based on the about string at most 4 times
        for (let i = 0; i < 4; i++) {
            const { id, answer } = await generate_script(about); // function to that sends a request to the api to generate a story
            this.movieId = id; // the id of the story
            this.script = answer; // the script of the story

            // if the script is in the correct format, then break out of the loop
            try {
                this.title = Story.getTitle(this.script);
                this.theme = Story.getTheme(this.script);
                this.story = Story.getStory(this.script);
                this.success = true;
                break;
            }
            catch (e) {
                console.log(e);
                continue;
            }
        }

        await VoiceOver.initialise_voices(); // initialise the voices

        this.fillQueue();

        return true;
    }

    // break down the story into individual lines where each line belongs to a character
    // and add it to the queue in the format { name: "character name", line: "character line" }

    fillQueue() {
        // for each line in the script get the character name and the character line
        let i = 0;
        for (const line of this.story) {
            const { characterName, characterLine } = Story.getCharacterText(line);
            const nameReg = /^(.*?)(?=\()/;
            let name_ = characterName.match(nameReg);
            
            // the name of the character is said before the character speaks by the narrator
            if (name_) {
                this.queue.push({
                    name: "Narrator",
                    line: characterName
                });
                name_ = name_[0].trim();
                i++;

                // the image queue contains the prompts for the image generation based on the script

                this.imageQueue.push({
                    id: i,
                    description: characterName
                });
                
            } else {
                name_ = characterName.trim();
            }

            // if the character voice does not exist, create a new voice for the character

            if (!this.characterVoice[name_]) {
                const voice = new VoiceOver(name_);
                console.log("Getting voice", voice)
                let voiceAlreadyExists = false;
                for (const existingVoiceName in this.characterVoice) {
                    if (this.characterVoice[existingVoiceName].selectedVoice === voice.selectedVoice) {
                        voiceAlreadyExists = true;
                        break;
                    }
                }

                if (!voiceAlreadyExists) {
                    voice.getVoice();
                }

                this.characterVoice[name_] = voice;
            }



            this.queue.push({
                name: name_,
                line: characterLine
            });

            i++;
        }
    }

    async ImageGen() {
        if (!fs.existsSync(`./movies/${this.movieId}/images`)) {
            fs.mkdirSync(`./movies/${this.movieId}/images`, { recursive: true });
        }

        const promises = this.imageQueue.map(async ({ id, description }) => {
        try {
            const image_url = await generate_image(description);
            const response = await fetch(image_url);

            if (!response.ok) {
                throw new Error(`unexpected response ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();
            fs.writeFileSync(`./movies/${this.movieId}/images/${id}.png`, Buffer.from(buffer));
        } catch (error) {
            console.error("Error generating image:", error);
        }
    });
    
    await Promise.all(promises);
    
    }

    

    async AudioGen() {
        console.log("Generating audio");
        
        if (!fs.existsSync(`./movies/${this.movieId}/audio`)) {
            fs.mkdirSync(`./movies/${this.movieId}/audio`, { recursive: true });
        }
        let i = 1;
        // send parallel requests to the api to generate the audio for each line
        const promises = this.queue.map(async ({ name, line }) => {
            try { this.characterVoice[name].play(line, this.movieId, i); }
            catch (e) { console.log(e); }
            i++;
        });

        await Promise.all(promises);
    }
}

module.exports = Story;

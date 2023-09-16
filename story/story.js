const VoiceOver = require('./voice');
const generate_script = require('./generate_script');
const generate_image = require('./image_gen');
const CombineAudio = require('./audioGen');
const { translateText } = require('./translate');
const fs = require('fs');


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

    static readFromFile(id) {
        try {
            const scriptPath = `${__dirname}/movies/${id}/script.txt`;
            const script = fs.readFileSync(scriptPath, 'utf8');
            const title = Story.getTitle(script);
            const theme = Story.getTheme(script);
            const content = Story.getStory(script);
            const storyData = {
                title,
                theme,
                content,
            };
            return storyData;
        }
        catch (e) {
            throw new Error('Failed to retrieve story data');
        }
    }
    
    static async translateFromFile(id, languageCode) {
        try {
            const { title, theme, content } = Story.readFromFile(id);
            const translatedTitle = await translateText(title, languageCode);
            const translatedTheme = await translateText(theme, languageCode);
            const translatedContent = await Promise.all(content.map(line => translateText(line, languageCode)));
            const storyData = {
                title: translatedTitle,
                theme: translatedTheme,
                content: translatedContent,
            };

            return storyData;
        } catch (e) {
            throw new Error('Failed to translate story data');
        }
    }


    constructor() {
        this.queue = [];
        this.characterVoice = {};
        this.imageQueue = [];

    }

    // The main logic of the story generation
    async initialize(about) {
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
        
    }

    // break down the story into individual lines where each line belongs to a character
    // and add it to the queue in the format { name: "character name", line: "character line" }

    fillVoiceQueue() {
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
        if (!fs.existsSync(`${__dirname}/movies/${this.movieId}/images`)) {
            fs.mkdirSync(`${__dirname}/movies/${this.movieId}/images`, { recursive: true });
        }

        const promises = this.imageQueue.map(async ({ id, description }) => {
        try {
            const image_url = await generate_image(description);
            const response = await fetch(image_url);

            if (!response.ok) {
                throw new Error(`unexpected response ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();
            fs.writeFileSync(`${__dirname}/movies/${this.movieId}/images/${id}.png`, Buffer.from(buffer));
        } catch (error) {
            console.error("Error generating image:", error);
        }
    });
    
    await Promise.all(promises);
    
    }

    

    async AudioGen() {
        console.log("Generating audio");
        
        if (!fs.existsSync(`${__dirname}/movies/${this.movieId}/audio`)) {
            fs.mkdirSync(`${__dirname}/movies/${this.movieId}/audio`, { recursive: true });
        }
        let i = 1;
        // send parallel requests to the api to generate the audio for each line
        const promises = this.queue.map(async ({ name, line }) => {
            try { this.characterVoice[name].play(line, this.movieId, i); }
            catch (e) { console.log(e); }
            i++;
        });

        await Promise.all(promises);

        console.log("Audio generated");
    }

    // save script 
    saveScript() {
        fs.writeFileSync(this.scriptPath, this.script);
    }

    // save prompt
    savePrompt() {
        fs.writeFileSync(this.promptPath, this.prompt);
    }

    async generate (about) {
        this.prompt = about;

        await this.initialize(about);
        if (!this.success) {
            return;
        }

        await VoiceOver.initialise_voices(); // initialise the voices
        this.fillVoiceQueue();

        const audioFolder = `${__dirname}/movies/${this.movieId}/audio`;
        this.audioPath = `${__dirname}/movies/${this.movieId}/en-audio.mp3`;
        this.scriptPath = `${__dirname}/movies/${this.movieId}/script.txt`;
        this.promptPath = `${__dirname}/movies/${this.movieId}/prompt.txt`;

        await this.AudioGen();

        // timeout to wait for the audio to be generated

        await new Promise(resolve => setTimeout(resolve, 10000));
        
        CombineAudio(audioFolder, this.audioPath);

        this.saveScript();
        this.savePrompt();
    }

    async translateAudio(languageCode) {
        try
        {
            await VoiceOver.initialise_voices(languageCode);
            const newCharacterVoice = this.characterVoice;
            for (const voice in newCharacterVoice) {
                const gender_ = newCharacterVoice[voice].gender;

                let new_voice = new VoiceOver();
                new_voice.randomVoiceByGender(gender_);

                 while (new_voice in this.characterVoice) {
                    new_voice = new_voice.randomVoiceByGender(gender_);
                }

                this.characterVoice[voice] = new_voice;
            }

            // translate the voice quque lines and replace the original lines with the translated lines
            
            const promises = this.queue.map(async ({ name, line }) => {
                const translatedLine = await translateText(line, languageCode);
                return { name, line: translatedLine };
            });

            this.queue = await Promise.all(promises);

            console.log(this.characterVoice);
        }
        catch (e) {
            console.log(e);
            throw new Error("Failed to translate audio, voice is not supported")
        }
    }

}

module.exports = Story;

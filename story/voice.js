const textToSpeech = require('@google-cloud/text-to-speech');
const dotenv = require('dotenv');
const fs = require('fs');
const util = require('util');
dotenv.config();
 

// create a client - which is basically a connection to the google cloud

const client = new textToSpeech.TextToSpeechClient();

class VoiceOver {
    static voices = {
        "male" : [],
        "female" : []
    }

    // get the available voices from google cloud
    
    static async initialise_voices() {
        try {
            const response = await client.listVoices();
            console.log("initialising voices");

            response[0].voices.forEach((voice) => {
                if (voice.languageCodes[0].startsWith("en")) {
                    if (voice.ssmlGender.toLowerCase() === "male") {

                        VoiceOver.voices.male.push({ voiceName: voice.name, lang: voice.languageCodes[0] });
                    } else {
                        VoiceOver.voices.female.push({ VoiceName: voice.name, lang: voice.languageCodes[0] });
                    }
                }
            });
        } catch (error) {
            console.error("Error initializing voices:", error);
            throw error;
        }

        console.log("initialised voices");
    }


    // returns true if the name is male name
    static isMale(name) {

        const males = fs.readFileSync(`${__dirname}/males.txt`).toString().trim().split("\n");

        const binarySearch = (arr, target) => {
            let left = 0;
            let right = arr.length - 1;
            while (left <= right) {
                const mid = Math.floor((left + right) / 2);
                if (arr[mid] === target) return mid;
                else if (arr[mid] < target) left = mid + 1;
                else right = mid - 1;
            }
            return null;
        }

        return binarySearch(males, name) ? true : false;
    }

    // returns a random voice from the list of voices based on name's gender
    static getRandomVoice(name) {
        if (VoiceOver.isMale(name)) {
            const randomIdx = Math.floor(Math.random() * VoiceOver.voices.male.length);
            return VoiceOver.voices.male[randomIdx];
        }
        const randomIdx = Math.floor(Math.random() * VoiceOver.voices.female.length);
        return VoiceOver.voices.female[randomIdx];
    }


    // gets a character voice based on the name of the character
    constructor(characterName) {
        this.characterName = characterName;
        this.getVoice()
    }

    getVoice() {
        const { voiceName, lang } = VoiceOver.getRandomVoice(this.characterName);
        this.voice = voiceName;
        this.lang = lang;
    }

    // generates a voice over for the character's lines in the script
    async play(characterLine, movieId, sequence) {
        const request = {
            input: { text: characterLine},
            voice: { name: this.voice, languageCode: this.lang},
            audioConfig: { audioEncoding: 'MP3' },
        };

        const [response] = await client.synthesizeSpeech(request);
        const writeFile = util.promisify(fs.writeFile);
        await writeFile(`./movies/${movieId}/audio/${sequence}.mp3`, response.audioContent, 'binary');
    }
}


module.exports = VoiceOver;
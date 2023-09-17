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
    
    static async initialise_voices(languageCode = "en") {

        VoiceOver.voices.male = [];
        VoiceOver.voices.female = [];

        try {
            const response = await client.listVoices();
            console.log("initialising voices");

            response[0].voices.forEach((voice) => {
                if (voice.languageCodes[0].startsWith(languageCode)) {
                    if (voice.ssmlGender.toLowerCase() === "male") {

                        VoiceOver.voices.male.push({ voiceName: voice.name, lang: voice.languageCodes[0], ssmlGender: voice.ssmlGender });
                    } else {
                        VoiceOver.voices.female.push({ VoiceName: voice.name, lang: voice.languageCodes[0], ssmlGender: voice.ssmlGender });
                    }
                }
            });
        } catch (error) {
            console.error("Error initializing voices:", error);
            throw error;
        }

        // if VoiceOver.voices.male is empty, then the language code is not supported

        if (VoiceOver.voices.male.length === 0 || VoiceOver.voices.female.length === 0) {
            throw new Error("Language code is not supported");
        }


    }


    // returns true if the name is male name
    static isFemale(name) {

        const females = fs.readFileSync(`${__dirname}/females.txt`).toString().trim().split("\n");

        if (name in females) return true;
        return false;

    }

    // returns a random voice from the list of voices based on name's gender
    static getRandomVoice(name) {
        if (VoiceOver.isFemale(name)) {
            const randomIdx = Math.floor(Math.random() * VoiceOver.voices.female.length);
            
            console.log(VoiceOver.voices.female[randomIdx])
            return VoiceOver.voices.female[randomIdx];
        }
        const randomIdx = Math.floor(Math.random() * VoiceOver.voices.male.length);
        return VoiceOver.voices.male[randomIdx];
    }


    // gets a character voice based on the name of the character
    constructor(characterName) {

        if (characterName !== undefined) {
            this.characterName = characterName;
            this.getVoice()
        }
    }
    


    getVoice() {
        const { voiceName, lang, ssmlGender } = VoiceOver.getRandomVoice(this.characterName);
        this.voice = voiceName;
        this.lang = lang;
        this.gender = ssmlGender;
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
        await writeFile(`${__dirname}/movies/${movieId}/audio/${sequence}.mp3`, response.audioContent, 'binary');
    }

    randomVoiceByGender(gender) {
        if (gender.toLowerCase() === "female") {
            const randomIdx = Math.floor(Math.random() * VoiceOver.voices.female.length);
            
            const {voiceName, lang, ssmlGender} = VoiceOver.voices.female[randomIdx];
            this.voice = voiceName;
            this.lang = lang;
            this.gender = ssmlGender;
            return {voiceName, lang, ssmlGender};
        }
        const randomIdx = Math.floor(Math.random() * VoiceOver.voices.male.length);
        const {voiceName, lang, ssmlGender } = VoiceOver.voices.male[randomIdx];

        this.voice = voiceName;
        this.lang = lang;
        this.gender = ssmlGender;

        return {voiceName, lang, ssmlGender};
    }
}


module.exports = VoiceOver;
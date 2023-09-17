const { Translate } = require('@google-cloud/translate').v2;
const dotenv = require('dotenv');
dotenv.config();

const translate = new Translate({ projectId: process.env.PROJECT_ID });

async function translateText(text, target) {
    try {
        const [translation] = await translate.translate(text, target);
        return translation;
    } catch (err) {
        console.error('ERROR:', err);
        throw err;
    }
}

async function returnListLanguages() {
    try {
        const [languages] = await translate.getLanguages();
        return languages;
    } catch (err) {
        console.error('ERROR:', err);
        throw err;
    }
}

module.exports = {
    translateText,
    returnListLanguages
};

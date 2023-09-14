const { OpenAI } = require("openai");
const dotenv = require("dotenv");
dotenv.config();

const openai = new OpenAI({ key: process.env.OPENAI_API_KEY });

const generate_image = async (description) => {
    try {
        const response = await openai.images.generate({
            prompt: "style of Impressionism (adults) " + description,
            n: 1,
            size: "512x512"
        });

        const image_url = response.data[0].url;
        return image_url;
    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
};

module.exports = generate_image;

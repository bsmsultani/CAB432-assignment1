const fs = require('fs');
const { OpenAI } = require("openai");
const dotenv = require("dotenv");
dotenv.config();

// Create an instance of the OpenAI API wrapper class

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generate a movie script based on the movie_about parameter

const generate_script = async (movie_about) => {

  console.log("generating movie", movie_about);
  const prompt = `generate a movie about ${movie_about}, the script should only contain the dialogue of the main characters. Do not use script format, use this format instead: title, theme: tags, narrator: talks about the sense and what is happening, character: talking.`;

  let exampleResponse;

  // Check if a saved response exists in the response.json file
  try {
    const savedResponse = fs.readFileSync(`${__dirname}/response.json`, 'utf-8');
    exampleResponse = JSON.parse(savedResponse).pop();
  } catch (error) {
    console.error("No saved response found.");
  }

  const messages = [
    { role: 'user', content: prompt },
    { role: 'system', content: "you are a helpful movie script generator"},
    exampleResponse
  ];

  const completion = await openai.chat.completions.create({
    messages,
    model: 'gpt-3.5-turbo'
  });

  const answer = completion.choices[0].message.content;
  const id = completion.id;

  return { id, answer };
};

module.exports = generate_script;

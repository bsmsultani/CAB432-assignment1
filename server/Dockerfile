# Use an official Node.js runtime as the base image
# get the latest version of node

FROM node:latest

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install application dependencies
RUN npm install


# install ffmpeg

RUN apt-get update && apt-get install -y ffmpeg

# Copy the rest of the application code into the container
COPY . .

# Expose the port your application will run on (replace 3000 with your application's port)
EXPOSE 3000

# Define the command to run your application (replace "npm start" with your actual start command)
CMD ["npm", "start"]

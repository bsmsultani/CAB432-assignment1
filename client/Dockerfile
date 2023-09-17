# Use an official Node.js runtime as the base image
FROM node:latest

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the React app code into the container
COPY . .

# Expose the port your React app will run on
EXPOSE 3001

# Define the command to start your React app
CMD ["npm", "start"]

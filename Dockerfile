# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Expose the port your application will run on (replace 3000 with your application's port)
EXPOSE 3000

# Define the command to run your application (replace "npm start" with your actual start command)
CMD ["npm", "start"]

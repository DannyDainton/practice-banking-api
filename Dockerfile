# Dockerfile for Node.js application
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Allow any port to be exposed
EXPOSE 0

# Command to start the app
CMD [ "npm", "start" ]

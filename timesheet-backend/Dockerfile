FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Make the start script executable
RUN chmod +x start.sh

# Expose port 3000
EXPOSE 3000

# Start the server with migrations
CMD ["./start.sh"]

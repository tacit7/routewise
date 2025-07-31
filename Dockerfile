FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5000


<<<<<<< Updated upstream
# Start the application
CMD ["npm", "start"]
=======
# Start in development mode with host binding
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5000"]
>>>>>>> Stashed changes

# Use Node.js Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY eshop/package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY eshop/ .

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"] 
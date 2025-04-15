# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY Frontend/package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY Frontend/ .

# Final stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install all dependencies
COPY Frontend/package*.json ./
RUN npm install

# Copy source code
COPY Frontend/ .

# Expose port
EXPOSE 8090

# Set environment variables
ENV NODE_ENV=production
ENV API_URL=http://backend:8080/api

# Start the application directly with node
CMD ["node", "server.js"] 
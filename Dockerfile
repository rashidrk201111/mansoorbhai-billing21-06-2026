# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
# Copy .npmrc if it exists
RUN if [ -f .npmrc ]; then cp .npmrc .; fi
RUN npm ci

# Copy the rest of the application
COPY . .

# Install serve globally
RUN npm install -g serve

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built assets from build stage
COPY --from=build /app/dist /app/dist

# Set environment variables
ENV PORT=8080
ENV HOST=0.0.0.0

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD ["serve", "-s", "dist", "-l", "8080"]

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

# Set build arguments for environment variables
ARG VITE_SUPABASE_URL=https://ftjukgofugzoxhvqhrez.supabase.co
ARG VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0anVrZ29mdWd6b3hodnFocmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NjQyMDksImV4cCI6MjA3NzI0MDIwOX0.j8kwtLaklvEB59X4_ir3HBGGkUmXfFbnl4M8lFC8wZM

# Export as environment variables for Vite
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

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

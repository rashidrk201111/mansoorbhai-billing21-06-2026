# Fix for "Invalid API Key" Error in Production

## Problem
The "Invalid API key" error occurs because Vite environment variables (`VITE_*`) need to be available **during the build process**, not at runtime. When you build the app, Vite embeds these values into your JavaScript files.

## Solution Applied
I've updated the following files to include your Supabase credentials:

### 1. **Dockerfile**
Added build arguments and environment variables so they're available during `npm run build`:
```dockerfile
ARG VITE_SUPABASE_URL=https://ftjukgofugzoxhvqhrez.supabase.co
ARG VITE_SUPABASE_ANON_KEY=your-key-here
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
```

### 2. **app.yaml**
Added environment variables for Google App Engine:
```yaml
env_variables:
  NODE_ENV: 'production'
  VITE_SUPABASE_URL: 'https://ftjukgofugzoxhvqhrez.supabase.co'
  VITE_SUPABASE_ANON_KEY: 'your-key-here'
```

### 3. **cloudbuild.yaml**
Added environment variables to the build step and docker build arguments.

## How to Redeploy

### Option 1: Using Cloud Build (Recommended)
```bash
gcloud builds submit --config cloudbuild.yaml
```

### Option 2: Using App Engine
```bash
gcloud app deploy app.yaml
```

### Option 3: Manual Docker Build
```bash
# Build with environment variables
docker build \
  --build-arg VITE_SUPABASE_URL=https://ftjukgofugzoxhvqhrez.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your-key \
  -t your-image-name .

# Then deploy the image
```

## Important Notes

1. **Environment variables are now baked into the build** - If you need to change Supabase credentials, you must rebuild and redeploy the entire app.

2. **The ANON key is public** - The Supabase anonymous key is meant to be exposed in the frontend. Your data is protected by Row Level Security (RLS) policies in your database.

3. **Verify after deployment**:
   - Clear your browser cache
   - Open DevTools > Console
   - Check if you see any Supabase errors
   - Try logging in

## Troubleshooting

If you still see the error after redeploying:

1. **Check build logs** to ensure environment variables were included:
```bash
gcloud builds list --limit=5
gcloud builds log [BUILD-ID]
```

2. **Verify the built files** contain your Supabase URL:
   - Download the built `dist/` folder
   - Search for your Supabase URL in the JavaScript files
   - If it's not there, the build didn't pick up the environment variables

3. **Check browser console** for the actual error message

4. **Verify Supabase credentials** are correct in your `.env` file

# Vercel Deployment Guide

This project has been configured for deployment on Vercel.

## Project Structure

- **Frontend**: `RelaiWorld_App/Frontend/` - React + Vite application
- **Backend**: `RelaiWorld_App/Backend/` - Express.js API server
- **API Routes**: `api/` - Vercel serverless functions

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

For production deployment:
```bash
vercel --prod
```

### 4. Environment Variables

Set the following environment variables in Vercel dashboard (Settings → Environment Variables):

**Required:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key

**Optional (for Zoho integration):**
- `ZOHO_CLIENT_ID` - Zoho OAuth client ID
- `ZOHO_CLIENT_SECRET` - Zoho OAuth client secret
- `ZOHO_REFRESH_TOKEN` - Zoho OAuth refresh token
- `ZOHO_ACCESS_TOKEN` - Zoho OAuth access token (optional, will be refreshed if needed)

**Other:**
- `NODE_ENV` - Set to `production` for production deployments
- `ALLOW_ALL_ORIGINS` - Set to `true` to allow all origins (for testing only)

### 5. Build Configuration

The `vercel.json` file is already configured with:
- Build command: Builds the Frontend
- Output directory: `RelaiWorld_App/Frontend/dist`
- Install command: Installs dependencies for both Backend and Frontend
- Function timeout: 30 seconds (max for Hobby plan, can be increased for Pro)

## API Routes

Vercel automatically creates serverless functions from files in the `api/` directory:

- `/api/server` - Main API handler (catches all `/api/*` routes except lead-registration)
- `/api/lead-registration` - Dedicated handler for lead registration endpoints

## Differences from Netlify

1. **API Routes**: Vercel uses `/api` directory at root level instead of `netlify/functions`
2. **Routing**: Vercel automatically routes API requests to matching files in `/api`
3. **Build Process**: Vercel builds the frontend and serves it from the output directory
4. **Environment Variables**: Set in Vercel dashboard instead of Netlify dashboard

## Testing Locally

You can test the Vercel deployment locally using:

```bash
vercel dev
```

This will start a local development server that mimics Vercel's production environment.

## Troubleshooting

### Build Failures
- Check that all dependencies are listed in `package.json` files
- Ensure Node.js version is compatible (Vercel uses Node 18.x by default)
- Check build logs in Vercel dashboard

### API Route Not Found
- Verify the file exists in `/api` directory
- Check that the file exports a default function
- Review Vercel function logs in dashboard

### Environment Variables Not Working
- Ensure variables are set in Vercel dashboard
- Check that variable names match exactly (case-sensitive)
- Redeploy after adding new environment variables

### CORS Issues
- Check CORS configuration in `app.js`
- Verify allowed origins include your Vercel domain
- Check browser console for specific CORS errors

## Migration from Netlify

If migrating from Netlify:
1. Export environment variables from Netlify dashboard
2. Import them into Vercel dashboard
3. Update any hardcoded Netlify URLs in your code
4. Test all API endpoints after deployment
5. Update frontend API base URLs if needed


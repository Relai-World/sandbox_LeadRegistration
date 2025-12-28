# RelaiWorld Backend — Serverless Conversion

This folder contains the Express backend (RelaiWorld_App/Backend) with a small refactor so it can run both as a local server and as serverless functions.

Two supported serverless options are included:

- AWS Lambda via the Serverless Framework (single HTTP function)
- Vercel (a catch-all function that forwards requests to the Express app)

Files added:
- `app.js` — the Express app (no server start) exported for reuse
- `handler.js` — a `serverless-http` wrapper that exports `handler` for AWS
- `serverless.yml` — Serverless Framework configuration
- `api/[...all].js` — catch-all API route for Vercel

Quickstart (local dev):

1. Install dependencies:

```powershell
cd RelaiWorld_App/Backend
npm install
```

2. Run locally:

```powershell
npm run dev
```

Serverless — AWS Lambda (using Serverless Framework):

1. Install Serverless (local/global):

```powershell
npm install -g serverless
# or use npx: npx serverless
```

2. Configure environment variables in your shell or CI (MONGODB_URI, SUPABASE_URL, SUPABASE_KEY, etc.)

3. Deploy:

```powershell
cd RelaiWorld_App/Backend
npm run deploy:aws
```

Note: `serverless.yml` uses HTTP API routes and will create a single lambda that proxies requests to the Express app via `handler.js`.

Vercel:

1. Create a project from this directory (RelaiWorld_App/Backend) or the repository root.
2. Make sure the environment variables are configured in your Vercel project settings.
3. Vercel will use `api/[...all].js` as the serverless entrypoint and route will be handled by the Express app.

If you prefer per-route serverless functions instead of a single Express handler, I can split the individual route modules into separate functions.

Netlify (Full site: frontend + backend)
------------------------------------

You can deploy the full site to Netlify using a single repo where the Frontend build is published and the Backend exports a single function.

Files added / updated for Netlify:

- `netlify.toml` (root) - builds frontend, runs backend npm install, sets functions dir to `RelaiWorld_App/Backend/netlify/functions` and redirects /api/* to the function.
- `_redirects` (root) - convenience redirect for static publish directories
- `RelaiWorld_App/Backend/netlify/functions/server.js` - Netlify function that wraps the Express app via `serverless-http`.

Local dev with Netlify CLI:

1. Install the Netlify CLI: `npm i -g netlify-cli`
2. From repo root run: `netlify dev` — it will run the build step and mount functions. Test endpoints at `http://127.0.0.1:8888/api/test` and `http://127.0.0.1:8888/health`.

Deploy steps (Netlify site settings)
----------------------------------

1. Connect repository in Netlify.
2. Build command (if not overridden by netlify.toml):
	- cd RelaiWorld_App/Frontend && npm ci && npm run build && cd ../Backend && npm ci
3. Publish directory: RelaiWorld_App/Frontend/dist
4. Functions directory: RelaiWorld_App/Backend/netlify/functions
5. Add environment variables in Site Settings: MONGODB_URI, SUPABASE_URL, SUPABASE_KEY, etc.

Local `.env` added (per your request)
---------------------------------

You asked to commit a local `.env` file into the repo (this project is private), so a `RelaiWorld_App/Backend/.env` file has been added containing the variables you supplied.

Important note about Supabase keys:
- The backend expects a server-side `SUPABASE_SERVICE_KEY` (service role key) to perform database operations from the server. If you only set `SUPABASE_ANON_KEY`, the backend will create a dummy Supabase client and server endpoints that require DB access (like `/api/user/login`) will return a clear 503 error: "Supabase is not configured".

If you want login and other server-side features to work, add `SUPABASE_SERVICE_KEY` to your `.env` or add it in your Netlify environment variables.


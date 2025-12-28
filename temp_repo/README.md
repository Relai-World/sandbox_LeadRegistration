# Relai-App

## Backend serverless deployment

The backend at `RelaiWorld_App/Backend` has been converted to support serverless deployments in two ways:

- AWS Lambda via Serverless Framework (see `serverless.yml` and `handler.js`)
- Vercel (catch-all function at `RelaiWorld_App/Backend/api/[...all].js`)

See `RelaiWorld_App/Backend/SERVERLESS_README.md` for step-by-step deploy instructions and local testing guidance.

Note: for quick local development this project now contains a committed `RelaiWorld_App/Backend/.env` file with the values you provided. If you prefer not to commit secrets later, replace it with a `.env.example` and keep real values out of the repo.
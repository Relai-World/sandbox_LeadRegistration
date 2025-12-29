import serverless from "serverless-http";
import { app, setupApp } from "../../server/app";
import { createServer } from "http";

// We need a server instance for registerRoutes even if it's not used for listening
const dummyServer = createServer(app);

// Initialize the app (routes, middleware etc)
await setupApp(dummyServer);

export const handler = serverless(app);

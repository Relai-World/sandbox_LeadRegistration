import serverless from "serverless-http";
import { app, setupApp } from "../../server/app";
import { createServer } from "http";

let initialized = false;
let handlerInstance: any;

export const handler = async (event: any, context: any) => {
    if (!initialized) {
        // We need a server instance for registerRoutes even if it's not used for listening
        const dummyServer = createServer(app);
        // Initialize the app (routes, middleware etc)
        await setupApp(dummyServer);
        handlerInstance = serverless(app);
        initialized = true;
    }
    return handlerInstance(event, context);
};

import { createServer } from "http";
import { app, setupApp, log } from "./app";
import { serveStatic } from "./static";

const httpServer = createServer(app);

(async () => {
  await setupApp(httpServer);

  if (process.env.NODE_ENV === "production" && !process.env.NETLIFY) {
    serveStatic(app);
  } else if (process.env.NODE_ENV !== "production") {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ONLY listen if we are not running on Vercel or Netlify
  if (!process.env.VERCEL && !process.env.NETLIFY) {
    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
      },
      () => {
        log(`serving on port ${port}`);
      },
    );
  }
})();

import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = join(__dirname, "dist");

// Serve static files with correct MIME types
app.use(
  express.static(distPath, {
    setHeaders: (res, path) => {
      // Explicit MIME types
      if (path.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css; charset=utf-8");
      } else if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      } else if (path.endsWith(".json")) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
      }
    },
    maxAge: "1d",
    etag: false,
  }),
);

// SPA fallback - serve index.html for all non-file routes
app.get("*", (req, res) => {
  res.sendFile(join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

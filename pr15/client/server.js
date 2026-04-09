const https = require("https");
const fs = require("fs");
const path = require("path");

const port = 3001;
const root = __dirname;
const certPath = path.join(root, "localhost.pem");
const keyPath = path.join(root, "localhost-key.pem");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error("Не найдены localhost.pem и localhost-key.pem");
  console.error("Сначала выполните: mkcert localhost 127.0.0.1 ::1");
  process.exit(1);
}

const server = https.createServer(
  {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath)
  },
  (req, res) => {
    const urlPath = req.url === "/" ? "/index.html" : req.url;
    const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(root, safePath);

    if (!filePath.startsWith(root)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }

      const ext = path.extname(filePath);
      res.writeHead(200, {
        "Content-Type": contentTypes[ext] || "application/octet-stream"
      });
      res.end(data);
    });
  }
);

server.listen(port, () => {
  console.log(`Client started: https://localhost:${port}`);
});

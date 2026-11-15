// Serveur de test local pour Anime Clock (http://localhost:5173). Pas utilisé en production.
// Usage : node scripts/serve.js [dossier]   (par défaut : la racine du projet)

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 5173;
const rootDirectory = path.resolve(process.argv[2] || path.join(__dirname, ".."));

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".md": "text/markdown; charset=utf-8"
};

http.createServer((request, response) => {
  let requestedPath = decodeURIComponent(request.url.split("?")[0]);
  if (requestedPath === "/") requestedPath = "/index.html";

  // path.normalize retire les « .. » : on refuse tout chemin qui sortirait du dossier servi.
  const filePath = path.join(rootDirectory, path.normalize(requestedPath));
  if (!filePath.startsWith(rootDirectory)) {
    response.writeHead(403);
    response.end();
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("404");
      return;
    }
    const contentType = CONTENT_TYPES[path.extname(filePath)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  });
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));

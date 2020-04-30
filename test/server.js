const xlsx = require('../index.js')
const fs = require('fs').promises
const http = require('http')
const host = 'localhost';
const port = 8080

const requestListener = (req, res) => {
  if (req.url === '/index.js') {
    fs.readFile(__dirname + "/index.js")
      .then(contents => { res.setHeader("Content-Type", "text/js"); res.writeHead(200); res.end(contents); })
      .catch(err => { res.writeHead(500); res.end(err); return; });
  } else if (req.url === '/index.css') {
    fs.readFile(__dirname + "/index.css")
      .then(contents => { res.setHeader("Content-Type", "text/css"); res.writeHead(200); res.end(contents); })
      .catch(err => { res.writeHead(500); res.end(err); return; });
  } else {
    fs.readFile(__dirname + "/index.html")
      .then(contents => { res.setHeader("Content-Type", "text/html"); res.writeHead(200); res.end(contents); })
      .catch(err => { res.writeHead(500); res.end(err); return; });
  }
};

const server = http.createServer(requestListener);

server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});

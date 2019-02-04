const http = require("http");
const hostname = "0.0.0.0";
const port = 3000;
let counter = 0;

const server = http.createServer((req, res) => {
  console.log(`\n${req.method} ${req.url}`);
  console.log(req.headers);

  req.on("data", (chunk) => {
    console.log("BODY: " + chunk);
    console.log("LENGTH: " + chunk.length);
    counter++;
  });
  console.log(counter);
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  if (counter > 10) {
    counter = 0;
    res.end("STOP!!!");
  }
  res.end("SENDCHUNK\n                                                                                                                      ");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

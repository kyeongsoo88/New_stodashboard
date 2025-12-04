const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Hello');
});
server.listen(3005, '0.0.0.0', () => {
  console.log('Server running on 3005');
});









const http = require('http');
const httpProxy = require('http-proxy');

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  secure: false,
  xfwd: true,
});

const server = http.createServer((req, res) => {
  proxy.web(req, res, {
    target: process.env.TARGET,
  });
});

server.on('listening', () => {
  // eslint-disable-next-line
  console.log(`http://${HOST}:${PORT}`);
});
server.listen(PORT);

const { forEach, get, isString, mapValues, uniq } = require('lodash');
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');

const PORT = process.env.PORT || 8081;
const HOST = process.env.HOST || 'localhost';

const CONFIG = JSON.parse(process.env.CONFIG || '{}');

const app = express();
app.use(helmet());

get(CONFIG, 'targets', []).forEach((target) => {
  app.use(
    `${target.route || '/'}*`,
    createProxyMiddleware({
      target: target.target,
      secure: false,
      changeOrigin: true,
      followRedirects: true,
      xfwd: true,
      ws: true,
      pathRewrite: {
        [`^${target.route || '/'}`]: '',
      },
      proxyReq(proxyReq) {
        proxyReq.setHeader('Connection', 'keep-alive');
      },
      onProxyRes(proxyRes, req, res) {
        if (
          target.maxAge !== undefined &&
          proxyRes.statusCode >= 200 &&
          proxyRes.statusCode < 400 &&
          res.statusCode === 200
        ) {
          proxyRes.headers['Cache-Control'] = `s-maxage=${target.maxAge}`;
        }

        forEach(proxyRes.headers, (value, key) => {
          if (target.deleteHeadersPattern !== undefined) {
            let delRegExp = new RegExp(target.deleteHeadersPattern);
            if (delRegExp.test(value) || delRegExp.test(key)) {
              delete proxyRes.headers[key];
            }
          }
        });

        proxyRes.headers = mapValues(proxyRes.headers, (value) => {
          if (!isString(value)) {
            return value;
          }
          return uniq(value.replace(/(,\s)/g, ',').split(',')).join(',');
        });
      },
      ...target,
    })
  );
});

const server = http.createServer(app);

server.on('listening', () => {
  console.log(`http://${HOST}:${PORT}`);
});

server.listen(PORT);

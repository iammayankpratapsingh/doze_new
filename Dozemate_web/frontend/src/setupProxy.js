const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Use local backend for local development, production server otherwise
  const isLocal = process.env.NODE_ENV !== 'production' || 
                  process.env.REACT_APP_USE_LOCAL_API === 'true';
  const target = isLocal ? 'http://localhost:5000' : 'https://admin.dozemate.com';
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: target,
      changeOrigin: true,
      secure: false, // Set to false for localhost, true for production
      logLevel: 'debug',
    })
  );
};

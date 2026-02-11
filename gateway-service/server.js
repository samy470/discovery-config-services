const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const consul = require('consul');
const cors = require('cors');
const app = express();
const PORT = 8080;
const healthcheck = require('express-healthcheck');

app.use('/health', healthcheck());

app.use('/health', (req, res) => {
  res.json({ 
    status: 'UP',
    service: 'service-a',
    timestamp: new Date(),
    checks: {
      database: 'connected',
      config: config ? 'loaded' : 'default'
    }
  });
});

const consulClient = new consul({ host: 'localhost', port: 8501 });
app.use(cors());

async function getServiceUrl(serviceName) {
  return new Promise((resolve, reject) => {
    consulClient.agent.service.list((err, services) => {
      if (err) {
        reject(err);
        return;
      }
      
      const service = Object.values(services).find(s => s.Service === serviceName);
      if (service) {
        resolve(`http://${service.Address}:${service.Port}`);
      } else {
        reject(new Error(`Service ${serviceName} not found`));
      }
    });
  });
}

app.use('/service-a', async (req, res, next) => {
  try {
    const target = await getServiceUrl('service-a');
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { '^/service-a': '' }
    })(req, res, next);
  } catch (err) {
    res.status(503).send('Service A unavailable');
  }
});

app.use('/service-b', async (req, res, next) => {
  try {
    const target = await getServiceUrl('service-b');
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { '^/service-b': '' }
    })(req, res, next);
  } catch (err) {
    res.status(503).send('Service B unavailable');
  }
});

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
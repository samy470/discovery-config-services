const express = require('express');
const app = express();
const PORT = 8761;

const consul = require('consul')();

consul.agent.service.register({
  name: 'discovery',  
  address: 'localhost',
  port: PORT,          
  check: {
    http: `http://localhost:${PORT}/health`,
    interval: '10s'
  }
});

// Find service
consul.agent.service.list((err, services) => {
  console.log('Available services:', Object.keys(services));
});

// Get service details
consul.catalog.service.nodes('user-service', (err, nodes) => {
  console.log('Service instances:', nodes);
});

let services = {};

app.get('/apps', (req, res) => {
  res.json(services);
});

app.post('/register', (req, res) => {
  const { name, host, port } = req.body;
  services[name] = `${host}:${port}`;
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Discovery: http://localhost:${PORT}`);
});
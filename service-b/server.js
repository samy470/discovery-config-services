const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 8082;
const consul = require('consul');
const healthcheck = require('express-healthcheck');

app.use('/health', healthcheck());

const consulClient = new consul({ host: 'localhost', port: 8501 });

consulClient.agent.service.register({
  name: 'service-b',  
  address: '192.168.1.68',
  port: PORT,        
  check: {
    http: `http://172.20.160.1:${PORT}/health`,
    interval: '10s',
    timeout: '5s'
  }
});

const profile = process.env.npm_config_configuration || 'local';
let config = { message: "Default message" };

async function loadConfig() {
  try {
    const response = await axios.get(`http://localhost:8888/config/${profile}`);
    const configObj = eval('(' + response.data + ')');
    config = { ...config, ...configObj };
    console.log(`Loaded config for profile: ${profile}`, config);
  } catch (err) {
    console.log('Config server not reachable, using defaults');
  }
}

loadConfig();

app.get('/time', (req, res) => {
  res.send(`${config.message} - Current time: ${new Date().toLocaleTimeString()}`);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP',
    service: 'service-b',
    timestamp: new Date(),
    profile: profile,
    config: config
  });
});

app.listen(PORT, () => {
  console.log(`Service B running on port ${PORT} with profile: ${profile}`);
});
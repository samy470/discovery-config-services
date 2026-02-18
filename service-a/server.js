const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 8081;
const consul = require('consul');
const healthcheck = require('express-healthcheck');

app.use('/health', healthcheck());

const consulClient = new consul({ host: 'localhost', port: 8501 });

consulClient.agent.service.register({
  name: 'service-a',  
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
    const response = await axios.get(`http://172.20.160.1:8888/config/${profile}`);
    const configObj = response.data;
    config = { ...config, ...configObj };
    console.log(`Loaded config for profile: ${profile}`, config);
    console.log('Config loaded:', config);
console.log('Message is:', config.message);
console.log('Profile used:', profile);
    
  } catch (err) {
    console.log('Config loaded:', config);
console.log('Message is:', config.message);
console.log('Profile used:', profile);
  }
}

loadConfig();

app.get('/hello', (req, res) => {
  console.log(`hello called, returning: "${config.message}"`);
  res.send(config.message);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP',
    service: 'service-a',
    timestamp: new Date(),
    profile: profile,
    config: config
  });
});

app.listen(PORT, () => {
  console.log(`Service A running on port ${PORT} with profile: ${profile}`);
});
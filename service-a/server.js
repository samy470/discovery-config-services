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
  address: '192.168.1.68', // Your Windows IP for other services to reach you
  port: PORT,        
  check: {
    http: `http://172.20.160.1:${PORT}/health`, // ✅ WSL can reach Windows here
    interval: '10s',
    timeout: '5s'
  }
});

let config = { message: "Default message" };

axios.get('http://localhost:8888/service-a/default')
  .then(response => {
    config = response.data;
    console.log('Got config:', config);
    
    // axios.post('http://localhost:8761/apps/service-a', {})
    //   .then(() => console.log('Registered with Discovery'))
    //   .catch(err => console.log('Discovery registration failed (but continuing):', err.message));
  })
  .catch(err => {
    console.log('Config server not reachable, using defaults');
  });

app.get('/hello', (req, res) => {
  res.send(config.message);
});

app.get('/health', (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Service A running on port ${PORT}`);
});
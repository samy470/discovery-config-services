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
  address: '192.168.1.68', // Your Windows IP for other services to reach you
  port: PORT,        
  check: {
    http: `http://172.20.160.1:${PORT}/health`, // ✅ WSL can reach Windows here
    interval: '10s',
    timeout: '5s'
  }
});

let config = { message: "Default message" };

axios.get('http://localhost:8888/service-b/default')
  .then(response => {
    config = response.data;
    console.log('Service B got config:', config);
    
    // axios.post('http://localhost:8761/apps/service-b', {})
    //   .then(() => console.log('Service B registered with Discovery'))
    //   .catch(err => console.log('Discovery registration failed:', err.message));
  })
  .catch(err => {
    console.log('Config server not reachable');
  });

app.get('/time', (req, res) => {
  const message = config.message;
  res.send(`${message} - Current time: ${new Date().toLocaleTimeString()}`);
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
  console.log(`Service B running on port ${PORT}`);
});
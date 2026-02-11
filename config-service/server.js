const express = require('express');
const app = express();
const PORT = 9000;
const consul = require('consul');

const consulClient = new consul({ host: 'localhost', port: 8501 });

consulClient.agent.service.register({
  name: 'config',  
  address: '192.168.1.68', // Your Windows IP for other services to reach you
  port: PORT,        
  check: {
    http: `http://172.20.160.1:${PORT}/health`, // ✅ WSL can reach Windows here
    interval: '10s',
    timeout: '5s'
  }
});

const configs = {
  "service-a": {
    message: "Hello from Service A",
    port: 8081
  },
  "service-b": {
    message: "Hello from Service B", 
    port: 8082
  },
  "gateway": {
    port: 8080
  }
};

app.get('/:serviceName/default', (req, res) => {
  const serviceName = req.params.serviceName;
  res.json(configs[serviceName] || {});
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP',
    service: 'service-a',
    timestamp: new Date(),
    checks: {
      database: 'connected',
    }
  });
});


app.listen(PORT, () => {
  console.log(`Config Server running on port ${PORT}`);
});
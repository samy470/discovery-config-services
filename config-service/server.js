const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 8888;

const GITHUB_RAW = 'https://raw.githubusercontent.com/samy470/config-repo/master';

app.get('/config/:profile', async (req, res) => {
  const profile = req.params.profile;
  
  try {
    const url = `${GITHUB_RAW}/config-${profile}.json`;
    const response = await axios.get(url);
    res.send(response.data);
  } catch (err) {
    try {
      const defaultUrl = `${GITHUB_RAW}/config.js`;
      const defaultResponse = await axios.get(defaultUrl);
      res.send(defaultResponse.data);
    } catch (err2) {
      res.status(500).json({ error: 'No config found' });
    }
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

app.listen(PORT, () => {
  console.log(`Config Server on http://localhost:${PORT}`);
});
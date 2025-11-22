const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Forward API calls to backend C++ server
app.get('/api/markets', async (req, res) => {
  try {
    const out = await axios.get('http://localhost:3001/api/markets');
    res.json(out.data);
  } catch (error) {
    console.error('Error communicating with backend [GET /api/markets]:', error.message);
    res.status(500).json({error: 'Backend error'});
  }
});

app.post('/api/trade', async (req, res) => {
  try {
    await axios.post('http://localhost:3001/api/trade', req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error communicating with backend [POST /api/trade]:', error.message);
    res.status(500).json({error: 'Backend error'});
  }
});

app.post('/api/resolve', async (req, res) => {
  try {
    await axios.post('http://localhost:3001/api/resolve', req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error communicating with backend [POST /api/resolve]:', error.message);
    res.status(500).json({error: 'Backend error'});
  }
});

app.listen(5000, () => console.log('Express server at :5000'));

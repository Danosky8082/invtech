const express = require('express');
const app = express();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Minimal test works' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Test server running on port ${PORT}`));
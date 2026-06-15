module.exports = (req, res) => {
  res.status(200).json({ 
    message: 'Backend is alive', 
    timestamp: new Date().toISOString() 
  });
};
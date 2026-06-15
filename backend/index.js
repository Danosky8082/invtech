module.exports = (req, res) => {
  res.status(200).json({ message: 'Backend alive', timestamp: new Date().toISOString() });
};
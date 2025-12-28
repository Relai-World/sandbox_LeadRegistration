// Simple test endpoint to verify Vercel routing works
module.exports = async (req, res) => {
  return res.status(200).json({
    message: 'API route is working!',
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    timestamp: new Date().toISOString()
  });
};


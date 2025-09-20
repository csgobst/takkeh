// Central error handling middleware
module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (status >= 500) {
    console.error('[ERROR]', err);
  }
  res.status(status).json({ message });
};

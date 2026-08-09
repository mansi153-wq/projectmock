const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Something went wrong on the server';

  res.status(statusCode).json({ status: 'error', message });
};

module.exports = errorHandler;
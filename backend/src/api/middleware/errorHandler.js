/**
 * Global Error Handler
 * Catches any error thrown or passed to next() in controllers.
 * Returns consistent JSON error shape — important for the frontend.
 */
function errorHandler(err, req, res, next) {
  console.error('[API Error]', err.message);

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

module.exports = { errorHandler };
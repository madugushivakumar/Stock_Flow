const { errorResponse } = require('../utils/response');

const notFoundHandler = (req, res) => {
  return errorResponse(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

const errorHandler = (err, req, res, next) => {
  // CORS origin policy rejection
  if (err.message && (err.message === 'Origin not allowed by CORS' || err.message.includes('CORS'))) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[CORS] Blocked unauthorized origin: ${req.headers.origin || 'unknown'}`);
    }
    return errorResponse(res, 403, 'CORS request rejected: Origin not allowed');
  }

  console.error('Unhandled Application Error:', err);

  // Prisma unique constraint violation (e.g., P2002)
  if (err.code === 'P2002') {
    const target = err.meta?.target || [];
    let message = 'A unique constraint was violated';
    if (target.includes('email')) {
      message = 'An account with this email already exists';
    } else if (target.includes('sku') || target.includes('organizationId')) {
      message = 'A product with this SKU already exists in your organization';
    }
    return errorResponse(res, 409, message, [{ target, message }]);
  }

  // Prisma record not found (e.g., P2025)
  if (err.code === 'P2025') {
    return errorResponse(res, 404, 'Record not found');
  }

  // General server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(
    res,
    statusCode,
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected error occurred. Please try again later.'
      : message,
    err.errors || []
  );
};

module.exports = {
  notFoundHandler,
  errorHandler,
};

const { errorResponse } = require('../utils/response');

const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error.errors) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return errorResponse(res, 400, 'Validation failed', formattedErrors);
      }
      return errorResponse(res, 400, 'Invalid request data', [error.message]);
    }
  };
};

module.exports = {
  validateRequest,
};

/**
 * Create a validation middleware from a Zod schema.
 * @param {import('zod').AnyZodObject} schema
 * @param {'body'|'query'|'params'} property
 */
function validateRequest(schema, property = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[property]);

    if (!result.success) {
      const error = new Error('Validation failed');
      error.statusCode = 400;
      error.isOperational = true;
      error.details = result.error.format();
      return next(error);
    }

    req[property] = result.data;
    next();
  };
}

module.exports = { validateRequest };

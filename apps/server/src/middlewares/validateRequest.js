/**
 * Create a validation middleware from a Zod schema.
 * @param {import('zod').AnyZodObject} schema
 * @param {'body'|'query'|'params'} property
 */
const { createAppError } = require('../utils/appError');

function validateRequest(schema, property = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[property]);

    if (!result.success) {
      return next(
        createAppError('Validation failed', 400, result.error.format())
      );
    }

    req[property] = result.data;
    next();
  };
}

module.exports = { validateRequest };

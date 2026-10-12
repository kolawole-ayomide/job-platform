import env from "../config/env.js";
import ApiError from "../utils/apiError.js";

/**
 * Converts known error types (Mongoose validation, duplicate key, cast errors,
 * JWT errors) into our ApiError shape, so the response is consistent no
 * matter where the error originated.
 */
function normalizeError(err) {
  if (err instanceof ApiError) return err;

  // Mongoose validation error (e.g. required field missing)
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiError.badRequest("Validation failed", errors);
  }

  // Mongoose duplicate key error (e.g. email already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return ApiError.conflict(`${field} already exists.`);
  }

  // Mongoose invalid ObjectId (e.g. /api/v1/jobs/not-a-valid-id)
  if (err.name === "CastError") {
    return ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  if (err.name === "JsonWebTokenError") {
    return ApiError.unauthorized("Invalid token.");
  }
  if (err.name === "TokenExpiredError") {
    return ApiError.unauthorized("Token expired.");
  }

  // Unknown/unexpected error - treat as a 500 and don't leak internals
  return ApiError.internal(env.isProduction ? "Something went wrong." : err.message);
}

// Must have 4 params for Express to recognize this as an error-handling middleware.
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  const normalized = normalizeError(err);

  if (!normalized.isOperational || !env.isProduction) {
    // Log full detail server-side for unexpected errors, or always in dev
    console.error(err);
  }

  res.status(normalized.statusCode).json({
    success: false,
    message: normalized.message,
    errors: normalized.errors,
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
}

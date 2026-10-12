import ApiError from "../utils/apiError.js";

/**
 * Catches any request that didn't match a route and forwards a 404
 * to the global error handler, instead of Express's default HTML error page.
 */
export default function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

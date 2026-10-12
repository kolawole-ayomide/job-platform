/**
 * Wraps an async controller so any thrown error/rejected promise is passed
 * to next() and caught by our global error handler, instead of crashing
 * the process or hanging the request.
 *
 * NOTE: Express 5 (which this project uses) actually does this automatically
 * for async route handlers. We still use this wrapper explicitly so the
 * codebase doesn't silently depend on that Express-version behavior, and so
 * it keeps working if the project is ever downgraded to Express 4.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;

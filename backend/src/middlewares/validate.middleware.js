import ApiError from "../utils/apiError.js";

/**
 * Generic validation middleware factory. Pass it a Zod schema and which
 * part of the request to validate ("body" | "query" | "params").
 *
 * Usage: router.post("/signup", validate(signupSchema), authController.signup)
 */
const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return next(ApiError.badRequest("Validation failed", errors));
  }

  // Express 5 defines req.query as a getter-only property (computed from
  // the URL), so `req.query = result.data` throws:
  // "Cannot set property query of #<IncomingMessage> which has only a getter".
  // req.body and req.params are still plain writable properties, so this
  // only needs the workaround for "query" - redefine it as a normal,
  // writable data property holding the parsed/coerced result.
  if (source === "query") {
    Object.defineProperty(req, "query", {
      value: result.data,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  } else {
    req[source] = result.data;
  }
  next();
};

export default validate;

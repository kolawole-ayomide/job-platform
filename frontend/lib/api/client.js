import axios from "axios";

// NEXT_PUBLIC_API_URL should point at the Express server root, e.g.
// http://localhost:5000/api/v1 in dev, https://your-api.onrender.com/api/v1 in prod.
const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL,
  // The backend sets the JWT as an HttpOnly cookie (see generateToken.js ->
  // setTokenCookie). withCredentials is required on every request or the
  // browser will silently drop that cookie on cross-origin calls.
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Normalizes every failure into the same shape the backend's errorHandler
// middleware produces, so calling code never has to guess at err.response?.data?.message.
export function normalizeError(error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.data) {
      const data = error.response.data;
      const fieldErrors = data.errors ?? [];
      // The backend's validate middleware sends a generic top-level message
      // ("Validation failed") plus a field-level `errors` array with the
      // actual reason. Almost every screen only ever renders `.message`, so
      // fold the field detail into it here instead of every call site
      // guessing at "something's wrong with one of these fields" - one fix
      // here fixes every "Validation failed"-type message app-wide.
      const message = fieldErrors.length
        ? fieldErrors
            .map((e) => (e.field ? `${e.field}: ${e.message}` : e.message))
            .join(" · ")
        : data.message ?? "Something went wrong.";
      return {
        statusCode: data.statusCode ?? error.response.status,
        message,
        errors: fieldErrors,
      };
    }
    if (error.request) {
      return {
        statusCode: 0,
        message: "Can't reach the server. Check your connection and try again.",
        errors: [],
      };
    }
  }
  return { statusCode: 500, message: "Something went wrong.", errors: [] };
}

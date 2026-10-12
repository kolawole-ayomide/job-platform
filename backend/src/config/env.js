import dotenv from "dotenv";

dotenv.config();

// Every env var the app needs to run. If any of these are missing at boot,
// we want the process to refuse to start rather than fail confusingly later
// (e.g. mongoose hanging forever, or JWT signing throwing mid-request).
const requiredEnvVars = [
  "PORT",
  "NODE_ENV",
  "DATABASE_URI",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "CLIENT_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // Thrown synchronously at import time, before the server tries to listen.
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. Copy .env.example to .env and fill these in.`
    );
  }
}

validateEnv();

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUri: process.env.DATABASE_URI,
  // Optional: lets you keep DATABASE_URI without a trailing /<db-name> path
  // and set the database name separately. If unset, Mongoose just uses
  // whatever database name (if any) is already in the URI.
  dbName: process.env.DB_NAME || undefined,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || "Wizpace <no-reply@wizpace.com>",
  },
  // Optional: Wizbot service checks this itself and throws a clear
  // "not configured" error at request-time if missing, so it's not in
  // requiredEnvVars — we don't want to block the whole server from
  // booting just because one feature's key isn't set yet.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  // Optional: how often (ms) the background scheduler scans all running
  // Wizbot agents. Defaults to 2 minutes in server.js if unset.
  wizbotScanIntervalMs: process.env.WIZBOT_SCAN_INTERVAL_MS,
  // Social login - optional, each provider's button just won't work until
  // its keys are set (checked at request-time, not required to boot).
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  linkedinClientId: process.env.LINKEDIN_CLIENT_ID,
  linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  linkedinRedirectUri: process.env.LINKEDIN_REDIRECT_URI,
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  githubRedirectUri: process.env.GITHUB_REDIRECT_URI,
  // Optional: real external job listings via JSearch (RapidAPI). Job
  // syncing (both the broad rotation and Wizbot's per-agent sync) just
  // no-ops with a logged error until this is set - doesn't block boot.
  jsearch: {
    apiKey: process.env.JSEARCH_API_KEY,
    apiHost: process.env.JSEARCH_API_HOST || "jsearch.p.rapidapi.com",
  },
  // Optional: how often (ms) the background job sync pulls fresh listings
  // for the broad query rotation. Defaults to 6 hours in server.js if unset.
  jobSyncIntervalMs: process.env.JOB_SYNC_INTERVAL_MS,
  isProduction: process.env.NODE_ENV === "production",
};

export default env;
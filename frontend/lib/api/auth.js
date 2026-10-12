import { apiClient } from "./client";

// POST /api/v1/auth/signup
export async function signup(payload) {
  const { data } = await apiClient.post("/auth/signup", payload);
  return data;
}

// POST /api/v1/auth/signin
export async function signin(payload) {
  const { data } = await apiClient.post("/auth/signin", payload);
  return data;
}

// POST /api/v1/auth/google - payload: { idToken } from Google Identity Services
export async function googleAuth(idToken) {
  const { data } = await apiClient.post("/auth/google", { idToken });
  return data;
}

// Builds the URL to redirect the browser to for LinkedIn's OAuth flow.
// The backend handles the callback and redirects back into the app.
export function getLinkedinAuthUrl() {
  const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId ?? "",
    redirect_uri: redirectUri ?? "",
    scope: "openid profile email",
  });
    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

// Builds the URL to redirect the browser to for GitHub's OAuth flow.
// The backend handles the callback and redirects back into the app.
export function getGithubAuthUrl() {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI;
  const params = new URLSearchParams({
    client_id: clientId ?? "",
    redirect_uri: redirectUri ?? "",
    scope: "read:user user:email",
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

// POST /api/v1/auth/logout
export async function logout() {
  const { data } = await apiClient.post("/auth/logout");
  return data;
}

// GET /api/v1/auth/me
export async function getMe() {
  const { data } = await apiClient.get("/auth/me");
  return data;
}

// POST /api/v1/auth/verify-email
export async function verifyEmail(token) {
  const { data } = await apiClient.post("/auth/verify-email", { token });
  return data;
}

// POST /api/v1/auth/resend-verification (requires auth)
export async function resendVerification() {
  const { data } = await apiClient.post("/auth/resend-verification");
  return data;
}

// POST /api/v1/auth/forgot-password
export async function forgotPassword(email) {
  const { data } = await apiClient.post("/auth/forgot-password", { email });
  return data;
}

// POST /api/v1/auth/reset-password
export async function resetPassword(token, password) {
  const { data } = await apiClient.post("/auth/reset-password", { token, password });
  return data;
}

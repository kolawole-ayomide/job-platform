import nodemailer from "nodemailer";
import env from "../config/env.js";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    // Not fatal at boot - lets you run the rest of the API without email
    // configured yet - but calling send() below will throw a clear error.
    return null;
  }

 transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: Number(env.smtp.port) || 587,
    secure: Number(env.smtp.port) === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
    // Nodemailer's defaults here are effectively "wait for the OS TCP
    // timeout" (can be 60-120s). If SMTP is unreachable (blocked port,
    // wrong host), we'd rather fail in a few seconds than hang the whole
    // signup/forgot-password request.
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
  });

  return transporter;
}

async function send({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    console.warn(
      `SMTP not configured - skipping email to ${to} ("${subject}"). Set SMTP_* env vars to enable sending.`
    );
    return { skipped: true };
  }

  return t.sendMail({ from: env.smtp.from, to, subject, html });
}

export async function sendVerificationEmail(toEmail, verificationUrl) {
  return send({
    to: toEmail,
    subject: "Verify your Wizpace account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome to Wizpace</h2>
        <p>Please verify your email address to activate your account.</p>
        <a href="${verificationUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">
          Verify Email
        </a>
        <p style="color:#666;font-size:13px;margin-top:16px;">
          This link expires in 24 hours. If you didn't create this account, you can ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(toEmail, resetUrl) {
  return send({
    to: toEmail,
    subject: "Reset your Wizpace password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Password reset request</h2>
        <p>Click the button below to set a new password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">
          Reset Password
        </a>
        <p style="color:#666;font-size:13px;margin-top:16px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

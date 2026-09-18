import nodemailer from "nodemailer";

const getTransporter = () => {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass || !Number.isInteger(port) || port < 1 || port > 65535) {
    const error = new Error("Email service is not configured.");
    error.statusCode = 500;
    throw error;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const sendPasswordResetEmail = async ({ to, name, token }) => {
  const clientUrl = process.env.CLIENT_URL?.trim();

  if (!clientUrl) {
    const error = new Error("CLIENT_URL is not configured.");
    error.statusCode = 500;
    throw error;
  }

  const resetUrl = `${clientUrl.replace(/\/+$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim();

  await transporter.sendMail({
    from,
    to,
    subject: "AI-BOS password reset",
    text: [
      `Hello ${name || "there"},`,
      "",
      "We received a request to reset your AI-BOS password.",
      "",
      `Reset your password: ${resetUrl}`,
      "",
      "This link expires in 15 minutes and can be used only once.",
      "If you did not request this, you can safely ignore this email.",
    ].join("\n"),
    html: `
      <p>Hello ${escapeHtml(name || "there")},</p>
      <p>We received a request to reset your AI-BOS password.</p>
      <p><a href="${escapeHtml(resetUrl)}">Reset your password</a></p>
      <p>This link expires in 15 minutes and can be used only once.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });
};

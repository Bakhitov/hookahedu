import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 0);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const servername = process.env.SMTP_SERVERNAME;

  if (!host || !port || !user || !pass) {
    return null;
  }

  if (!transporter) {
    const secureEnv = process.env.SMTP_SECURE;
    const secure = secureEnv ? secureEnv === "true" : port === 465;
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      tls: servername ? { servername } : undefined,
      auth: { user, pass },
    });
  }

  return transporter;
}

function getFromAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER || null;
}

export async function sendEmail({ to, subject, text, html }) {
  const from = getFromAddress();
  if (!from) {
    console.warn("SMTP_FROM or SMTP_USER is not configured; email skipped");
    return;
  }

  const client = getTransporter();
  if (!client) {
    console.warn("SMTP settings are not fully configured; email skipped");
    return;
  }

  await client.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

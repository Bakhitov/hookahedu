import nodemailer from "nodemailer";

let transporter;

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : null;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendEmail({ to, subject, text, html }) {
  const from = process.env.SMTP_FROM;
  if (!from) {
    console.warn("SMTP_FROM is not configured; email skipped");
    return;
  }

  if (!transporter) {
    transporter = createTransporter();
  }

  if (!transporter) {
    console.warn("SMTP is not configured; email skipped");
    return;
  }

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

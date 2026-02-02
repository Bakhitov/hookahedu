import { Resend } from "resend";

let resendClient;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

function getFromAddress() {
  const explicitFrom = process.env.RESEND_FROM;
  if (explicitFrom) {
    return explicitFrom;
  }

  const domain = process.env.RESEND_DOMAIN;
  if (domain) {
    return `no-reply@${domain}`;
  }

  return null;
}

export async function sendEmail({ to, subject, text, html }) {
  const from = getFromAddress();
  if (!from) {
    console.warn("RESEND_FROM or RESEND_DOMAIN is not configured; email skipped");
    return;
  }

  const client = getResendClient();
  if (!client) {
    console.warn("RESEND_API_KEY is not configured; email skipped");
    return;
  }

  await client.emails.send({
    from,
    to,
    subject,
    text,
    html,
  });
}

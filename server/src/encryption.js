import crypto from "crypto";

function getKey() {
  const raw = process.env.IIN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("IIN_ENCRYPTION_KEY is required");
  }

  let key;
  if (raw.length === 44) {
    key = Buffer.from(raw, "base64");
  } else if (raw.length === 64) {
    key = Buffer.from(raw, "hex");
  } else {
    throw new Error("IIN_ENCRYPTION_KEY must be 32 bytes (base64 or hex)");
  }

  if (key.length !== 32) {
    throw new Error("IIN_ENCRYPTION_KEY must decode to 32 bytes");
  }

  return key;
}

export function encryptIin(value) {
  if (!value) {
    return { encrypted: null, last4: null };
  }

  const normalized = String(value).replace(/\s+/g, "");
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(normalized, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    encrypted: [iv.toString("base64"), encrypted.toString("base64"), tag.toString("base64")].join(":"),
    last4: normalized.slice(-4),
  };
}

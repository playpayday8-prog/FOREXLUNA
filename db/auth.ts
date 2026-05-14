const encoder = new TextEncoder();

export async function hashPassword(password: string, salt: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const SESSION_SECRET = Netlify.env.get("SESSION_SECRET") || "forex-luna-signal-default-session-key";

async function hmacSign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createToken(userId: number, username: string): Promise<string> {
  const payload = `${userId}:${username}`;
  const sig = await hmacSign(payload);
  return `${payload}:${sig}`;
}

export async function verifyToken(
  token: string,
): Promise<{ userId: number; username: string } | null> {
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return null;
    const [userIdStr, username, sig] = parts;
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) return null;
    const expectedSig = await hmacSign(`${userId}:${username}`);
    if (sig !== expectedSig) return null;
    return { userId, username };
  } catch {
    return null;
  }
}

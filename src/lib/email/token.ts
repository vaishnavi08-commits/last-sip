import crypto from "crypto";

export type LinkAction = "order" | "ordered" | "plenty" | "basket";

export type TokenPayload = {
  itemId: string;
  userId: string;
  action: LinkAction;
  nonce: string;
  exp: number; // ms since epoch
};

const LINK_LIFETIME_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function hmac(body: string): string {
  const secret = process.env.EMAIL_LINK_SECRET;
  if (!secret) throw new Error("EMAIL_LINK_SECRET is not set.");
  return crypto.createHmac("sha256", secret).update(body).digest("base64url");
}

export function signActionToken(itemId: string, userId: string, action: LinkAction): string {
  const payload: TokenPayload = {
    itemId,
    userId,
    action,
    nonce: crypto.randomBytes(8).toString("hex"),
    exp: Date.now() + LINK_LIFETIME_MS,
  };
  const body = base64url(JSON.stringify(payload));
  return `${body}.${hmac(body)}`;
}

// Verifies the signature and expiry. Never trusts the token's contents for
// anything beyond identifying which row and action to act on — the caller
// still re-reads the real row from the database before doing anything.
export function verifyActionToken(token: string): TokenPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  let expectedSig: string;
  try {
    expectedSig = hmac(body);
  } catch {
    return null;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
  if (!payload.itemId || !payload.userId || !payload.action || typeof payload.exp !== "number") return null;
  if (Date.now() > payload.exp) return null;
  return payload;
}

export function tokenHash(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

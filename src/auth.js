import crypto from "crypto";

const COOKIE_NAME = "admin_session";

// Cree un jeton signe (HMAC) qui prouve l'authentification admin
function sign(value, secret) {
  const h = crypto.createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${h}`;
}

function verify(token, secret) {
  if (!token || !token.includes(".")) return false;
  const idx = token.lastIndexOf(".");
  const value = token.slice(0, idx);
  const expected = sign(value, secret);
  // comparaison a temps constant
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Cree le cookie apres un login reussi
export function createSessionToken() {
  const secret = process.env.SESSION_SECRET || "dev-secret";
  // valeur = "admin:timestamp" (sert juste de charge utile, signee)
  return sign(`admin:${Date.now()}`, secret);
}

export function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 jours
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

export function isAuthenticated(req) {
  const secret = process.env.SESSION_SECRET || "dev-secret";
  const token = req.cookies?.[COOKIE_NAME];
  return verify(token, secret);
}

// Middleware Express : protege les routes d'ecriture
export function requireAuth(req, res, next) {
  if (isAuthenticated(req)) return next();
  return res.status(401).json({ error: "Authentification requise" });
}

// Verifie le mot de passe a temps constant.
// On retire les espaces/retours a la ligne accidentels autour (copier-coller).
export function checkPassword(input) {
  const expected = (process.env.ADMIN_PASSWORD || "").trim();
  if (!expected) return false;
  const a = Buffer.from(String(input ?? "").trim());
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

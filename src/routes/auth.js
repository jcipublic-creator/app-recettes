import { Router } from "express";
import {
  checkPassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  isAuthenticated,
} from "../auth.js";

export const authRouter = Router();

// POST /api/login  { password }
authRouter.post("/login", (req, res) => {
  const { password } = req.body || {};
  if (!checkPassword(password)) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }
  const token = createSessionToken();
  setSessionCookie(res, token);
  res.json({ ok: true });
});

// POST /api/logout
authRouter.post("/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

// GET /api/me -> indique si l'utilisateur est admin
authRouter.get("/me", (req, res) => {
  res.json({ admin: isAuthenticated(req) });
});

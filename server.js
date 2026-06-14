import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { recipesRouter } from "./src/routes/recipes.js";
import { authRouter } from "./src/routes/auth.js";
import { uploadRouter } from "./src/routes/upload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// API
app.use("/api", authRouter);
app.use("/api", uploadRouter);
app.use("/api", recipesRouter);

// Sante (utile pour Railway)
app.get("/healthz", (req, res) => res.json({ ok: true }));

// Diagnostic TEMPORAIRE : indique quelles variables d'env le serveur voit
// (n'expose aucune valeur secrete, seulement leur presence). A retirer ensuite.
app.get("/api/diag", async (req, res) => {
  const out = {
    redisUrlSet: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    redisTokenSet: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
    cloudinarySet: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
    adminPasswordSet: Boolean((process.env.ADMIN_PASSWORD || "").trim()),
    adminPasswordLen: (process.env.ADMIN_PASSWORD || "").trim().length,
    sessionSecretSet: Boolean(process.env.SESSION_SECRET),
  };
  try {
    const { redis } = await import("./src/redis.js");
    await redis.set("__diag__", "ok");
    out.redisPing = await redis.get("__diag__");
    await redis.del("__diag__");
  } catch (e) {
    out.redisPing = "ERREUR: " + e.message;
  }
  res.json(out);
});

// Front statique
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App Recettes en écoute sur le port ${PORT}`);
});

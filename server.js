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

// Front statique
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App Recettes en écoute sur le port ${PORT}`);
});

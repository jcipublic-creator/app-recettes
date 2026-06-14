import { Router } from "express";
import { getCloudinary, cloudinaryConfigured } from "../cloudinary.js";
import { requireAuth } from "../auth.js";

export const uploadRouter = Router();

// GET /api/upload/signature  (protege)
// Renvoie une signature pour permettre un upload direct vers Cloudinary
// depuis le navigateur (sans exposer l'API secret).
uploadRouter.get("/upload/signature", requireAuth, (req, res) => {
  if (!cloudinaryConfigured()) {
    return res.status(503).json({ error: "Cloudinary non configuré" });
  }
  const cloudinary = getCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const folder = "recettes";
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET
  );
  res.json({
    timestamp,
    folder,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
});

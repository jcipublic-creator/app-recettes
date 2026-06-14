import { Router } from "express";
import {
  getRecipe,
  listRecipes,
  saveRecipe,
  deleteRecipe,
} from "../redis.js";
import { requireAuth } from "../auth.js";

export const recipesRouter = Router();

// Categories par defaut (modifiables cote front)
const CATEGORIES = ["Entrée", "Plat", "Dessert", "Apéritif", "Accompagnement", "Boisson", "Autre"];

// Normalise une recette recue du client
function sanitizeRecipe(body) {
  const toArray = (v) => (Array.isArray(v) ? v : []);
  return {
    id: body.id || undefined,
    titre: String(body.titre || "").trim(),
    categorie: String(body.categorie || "").trim(),
    sousCategorie: String(body.sousCategorie || "").trim(),
    difficulte: Math.min(3, Math.max(1, Number(body.difficulte) || 1)),
    dureePreparation: Number(body.dureePreparation) || 0,
    dureeCuisson: Number(body.dureeCuisson) || 0,
    medias: toArray(body.medias)
      .map((m) => ({
        type: m.type === "video" ? "video" : "image",
        url: String(m.url || "").trim(),
      }))
      .filter((m) => m.url),
    ingredients: toArray(body.ingredients)
      .map((i) => ({
        quantite: i.quantite != null ? String(i.quantite).trim() : "",
        unite: String(i.unite || "").trim(),
        nom: String(i.nom || "").trim(),
      }))
      .filter((i) => i.nom),
    etapesPreparation: toArray(body.etapesPreparation)
      .map((s) => String(s).trim())
      .filter(Boolean),
    etapesCuisson: toArray(body.etapesCuisson)
      .map((s) => ({
        description: String(s.description || "").trim(),
        temperature: String(s.temperature || "").trim(),
        mode: String(s.mode || "").trim(),
        duree: String(s.duree || "").trim(),
      }))
      .filter((s) => s.description || s.temperature || s.mode || s.duree),
    commentaires: String(body.commentaires || "").trim(),
    dateCreation: body.dateCreation,
  };
}

// GET /api/categories
recipesRouter.get("/categories", (req, res) => {
  res.json(CATEGORIES);
});

// GET /api/recipes  -> liste
recipesRouter.get("/recipes", async (req, res) => {
  try {
    const recipes = await listRecipes();
    res.json(recipes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/recipes/:id -> detail
recipesRouter.get("/recipes/:id", async (req, res) => {
  try {
    const recipe = await getRecipe(req.params.id);
    if (!recipe) return res.status(404).json({ error: "Recette introuvable" });
    res.json(recipe);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/recipes -> creation (protege)
recipesRouter.post("/recipes", requireAuth, async (req, res) => {
  try {
    const data = sanitizeRecipe(req.body);
    delete data.id;
    if (!data.titre) return res.status(400).json({ error: "Titre requis" });
    const saved = await saveRecipe(data);
    res.status(201).json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/recipes/:id -> mise a jour (protege)
recipesRouter.put("/recipes/:id", requireAuth, async (req, res) => {
  try {
    const existing = await getRecipe(req.params.id);
    if (!existing) return res.status(404).json({ error: "Recette introuvable" });
    const data = sanitizeRecipe({ ...req.body, id: req.params.id });
    data.dateCreation = existing.dateCreation;
    if (!data.titre) return res.status(400).json({ error: "Titre requis" });
    const saved = await saveRecipe(data);
    res.json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/recipes/:id -> suppression (protege)
recipesRouter.delete("/recipes/:id", requireAuth, async (req, res) => {
  try {
    await deleteRecipe(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const INDEX_KEY = "recipes:index"; // sorted set : membre = id, score = dateCreation
const recipeKey = (id) => `recipe:${id}`;

// Genere un id court et unique
export function newId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  );
}

// Recupere une recette par id
export async function getRecipe(id) {
  return await redis.get(recipeKey(id));
}

// Liste toutes les recettes (les plus recentes d'abord)
export async function listRecipes() {
  const ids = await redis.zrange(INDEX_KEY, 0, -1, { rev: true });
  if (!ids || ids.length === 0) return [];
  const keys = ids.map(recipeKey);
  const recipes = await redis.mget(...keys);
  return recipes.filter(Boolean);
}

// Cree ou met a jour une recette
export async function saveRecipe(recipe) {
  const now = new Date().toISOString();
  if (!recipe.id) {
    recipe.id = newId();
    recipe.dateCreation = now;
  }
  recipe.dateModification = now;

  await redis.set(recipeKey(recipe.id), recipe);
  // score = timestamp de creation pour le tri
  const score = new Date(recipe.dateCreation || now).getTime();
  await redis.zadd(INDEX_KEY, { score, member: recipe.id });
  return recipe;
}

// Supprime une recette
export async function deleteRecipe(id) {
  await redis.del(recipeKey(id));
  await redis.zrem(INDEX_KEY, id);
}

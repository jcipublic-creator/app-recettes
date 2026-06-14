// Insertion / mise a jour de recettes dans Redis depuis un fichier JSON.
//
// Usage :
//   node scripts/seed.js scripts/recettes.json
//
// Le fichier JSON peut contenir une seule recette {..} ou un tableau [{..}, {..}].
// Necessite les variables d'env UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN
// (chargees automatiquement depuis .env en local).

import "dotenv/config";
import fs from "fs";
import { saveRecipe } from "../src/redis.js";

const file = process.argv[2] || "scripts/recettes.json";

if (!fs.existsSync(file)) {
  console.error(`Fichier introuvable : ${file}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(file, "utf8"));
const recipes = Array.isArray(raw) ? raw : [raw];

const run = async () => {
  for (const r of recipes) {
    const saved = await saveRecipe(r);
    console.log(`✓ ${saved.titre}  (id: ${saved.id})`);
  }
  console.log(`\n${recipes.length} recette(s) enregistrée(s).`);
};

run().catch((e) => {
  console.error("Erreur :", e.message);
  process.exit(1);
});

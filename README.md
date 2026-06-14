# 🍲 App Recettes de cuisine

Application web pour stocker et consulter mes recettes.
Consultation publique, ajout/édition protégés par mot de passe.

## Stack

- **Node.js + Express** — serveur web et API
- **Upstash Redis** (REST) — stockage des données des recettes
- **Cloudinary** — stockage des photos / vidéos (l'app ne garde que les URLs)
- **Railway** — hébergement
- **GitHub** — code source

## Structure

```
server.js              Point d'entrée Express
src/
  redis.js             Client Upstash + accès aux recettes
  cloudinary.js        Config Cloudinary
  auth.js              Authentification admin (cookie signé)
  routes/
    recipes.js         API CRUD des recettes
    auth.js            Login / logout
    upload.js          Signature pour upload direct vers Cloudinary
public/                Frontend (HTML/CSS/JS, responsive)
  index.html           Liste + filtres
  recette.html         Détail d'une recette
  admin.html           Connexion + formulaire d'ajout/édition
scripts/
  seed.js              Insertion de recettes depuis un fichier JSON
  recette-exemple.json Exemple de format
```

## Variables d'environnement

Voir `.env.example`. À définir en local (fichier `.env`) **et** dans Railway :

| Variable | Description |
|---|---|
| `UPSTASH_REDIS_REST_URL` | URL REST de la base Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Token Upstash |
| `CLOUDINARY_CLOUD_NAME` | Nom du cloud Cloudinary |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary |
| `ADMIN_PASSWORD` | Mot de passe pour l'administration |
| `SESSION_SECRET` | Chaîne aléatoire pour signer le cookie de session |
| `PORT` | Port (Railway le fournit automatiquement) |

> ⚠️ Ne jamais committer le fichier `.env` (il est déjà dans `.gitignore`).

## Lancer en local

```bash
npm install
cp .env.example .env   # puis remplir les valeurs
npm run dev            # http://localhost:3000
```

## Ajouter des recettes en lot

```bash
node scripts/seed.js scripts/recettes.json
```

Le fichier peut contenir une recette `{...}` ou un tableau `[{...}, {...}]`.

## Déploiement sur Railway

1. Pousser le code sur GitHub.
2. Dans Railway : **New Project → Deploy from GitHub repo**, sélectionner ce dépôt.
3. Railway détecte Node.js et lance `npm start`.
4. Onglet **Variables** : ajouter toutes les variables ci-dessus (sauf `PORT`, géré par Railway).
5. Onglet **Settings → Networking** : générer un domaine public.

C'est en ligne. 🎉

## Modèle d'une recette

```json
{
  "titre": "...",
  "categorie": "Dessert",
  "sousCategorie": "Tarte",
  "difficulte": 1,
  "dureePreparation": 25,
  "dureeCuisson": 35,
  "medias": [{ "type": "image", "url": "https://..." }],
  "ingredients": [{ "quantite": "4", "unite": "", "nom": "pommes" }],
  "etapesPreparation": ["étape 1", "étape 2"],
  "etapesCuisson": [
    { "description": "...", "temperature": "180°C", "mode": "Four", "duree": "35 min" }
  ],
  "commentaires": "..."
}
```

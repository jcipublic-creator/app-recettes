#!/bin/bash
# Déploiement en une commande : commit + push (Railway redéploie tout seul).
#
# Utilisation :
#   ./deploy.sh "message décrivant l'évolution"
#   ./deploy.sh                # message automatique avec la date
#
# La première fois seulement, rends le script exécutable :
#   chmod +x deploy.sh

set -e  # stoppe au moindre échec

# Se placer dans le dossier du script, quel que soit l'endroit d'où on l'appelle
cd "$(dirname "$0")"

# Message de commit : argument fourni, sinon date du jour
MSG="${1:-MAJ du $(date '+%d/%m/%Y %H:%M')}"

echo "→ Ajout des fichiers modifiés…"
git add -A

# S'il n'y a rien à committer, on s'arrête proprement
if git diff --cached --quiet; then
  echo "Rien à déployer : aucun changement détecté."
  exit 0
fi

echo "→ Commit : $MSG"
git commit -m "$MSG"

echo "→ Push vers GitHub…"
git push

echo ""
echo "✅ Poussé sur GitHub. Railway va redéployer automatiquement."
echo "   Vérifie le statut sur https://railway.app (onglet Deployments)."

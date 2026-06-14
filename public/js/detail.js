const $ = (s) => document.querySelector(s);
const id = new URLSearchParams(location.search).get("id");

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function diffStars(n) {
  n = Number(n) || 1;
  let out = "";
  for (let i = 1; i <= 3; i++) out += i <= n ? "●" : '<span class="off">●</span>';
  return `<span class="diff">${out}</span> ${n}/3`;
}

function media(m) {
  if (m.type === "video") {
    return `<video src="${escapeHtml(m.url)}" controls></video>`;
  }
  return `<img src="${escapeHtml(m.url)}" alt="" loading="lazy" />`;
}

// Formate un nombre : arrondi a 1 decimale, sans .0 inutile, separateur virgule.
function formatNum(n) {
  const r = Math.round(n * 10) / 10;
  return String(r).replace(".", ",");
}

// Multiplie une quantite texte par un facteur.
// Gere : nombre simple ("2.3", "0,8"), fourchette ("1,3-1,5", "12 à 15"),
// et laisse intact ce qui n'a pas de nombre exploitable.
function scaleQuantite(str, factor) {
  if (!str) return str;
  const s = String(str).trim();
  const num = "(\\d+(?:[.,]\\d+)?)";
  const toNum = (x) => parseFloat(x.replace(",", "."));

  // Fourchette : a–b  (séparateurs - – — à)
  const rangeFull = s.match(new RegExp("^" + num + "\\s*(?:[-–—]|à)\\s*" + num + "(.*)$"));
  if (rangeFull) {
    const a = formatNum(toNum(rangeFull[1]) * factor);
    const b = formatNum(toNum(rangeFull[2]) * factor);
    return `${a}–${b}${rangeFull[3] || ""}`;
  }
  // Nombre simple eventuellement suivi de texte
  const single = s.match(new RegExp("^" + num + "(.*)$"));
  if (single) {
    return formatNum(toNum(single[1]) * factor) + (single[2] || "");
  }
  return s; // pas de nombre : on ne touche pas
}

function ingredient(i, factor) {
  const scaled = scaleQuantite(i.quantite, factor);
  const q = [scaled, i.unite].filter(Boolean).join(" ");
  return `<li>${q ? `<span class="q">${escapeHtml(q)}</span> ` : ""}${escapeHtml(i.nom)}</li>`;
}

function cuissonStep(s) {
  const params = [];
  if (s.temperature) params.push(`<span><b>Température :</b> ${escapeHtml(s.temperature)}</span>`);
  if (s.mode) params.push(`<span><b>Mode :</b> ${escapeHtml(s.mode)}</span>`);
  if (s.duree) params.push(`<span><b>Durée :</b> ${escapeHtml(s.duree)}</span>`);
  return `<div class="cuisson-step">
    ${s.description ? `<div>${escapeHtml(s.description)}</div>` : ""}
    ${params.length ? `<div class="params">${params.join("")}</div>` : ""}
  </div>`;
}

function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

async function delRecipe() {
  if (!confirm("Supprimer définitivement cette recette ?")) return;
  const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
  if (res.ok) { location.href = "/"; }
  else { showToast("Suppression impossible (connecté en admin ?)"); }
}

let currentRecipe = null;
let basePortions = 4;

// (Re)dessine la liste d'ingrédients selon le nombre de portions choisi.
function renderIngredients(portions) {
  const list = document.getElementById("ingredientsList");
  if (!list || !currentRecipe) return;
  const factor = basePortions > 0 ? portions / basePortions : 1;
  list.innerHTML = (currentRecipe.ingredients || [])
    .map((i) => ingredient(i, factor))
    .join("");
}

function setupPortions() {
  const input = document.getElementById("portInput");
  if (!input) return;
  const apply = () => {
    let v = Math.max(1, Math.round(Number(input.value) || basePortions));
    input.value = v;
    renderIngredients(v);
  };
  input.addEventListener("input", apply);
  document.getElementById("portMinus").addEventListener("click", () => {
    input.value = Math.max(1, (Number(input.value) || basePortions) - 1);
    apply();
  });
  document.getElementById("portPlus").addEventListener("click", () => {
    input.value = (Number(input.value) || basePortions) + 1;
    apply();
  });
  document.getElementById("portReset").addEventListener("click", () => {
    input.value = basePortions;
    apply();
  });
  renderIngredients(basePortions);
}

function render(r) {
  currentRecipe = r;
  basePortions = Math.max(1, Math.round(Number(r.portions) || 4));
  const total = (Number(r.dureePreparation) || 0) + (Number(r.dureeCuisson) || 0);
  document.title = r.titre;

  const html = `
    <h1>${escapeHtml(r.titre)}</h1>
    <div class="submeta">
      ${r.categorie ? `<span class="tag cat">${escapeHtml(r.categorie)}</span>` : ""}
      ${r.sousCategorie ? `<span class="tag">${escapeHtml(r.sousCategorie)}</span>` : ""}
    </div>

    ${(r.medias || []).length ? `<div class="gallery">${r.medias.map(media).join("")}</div>` : ""}

    <div class="info-row">
      <div><b>Difficulté :</b> ${diffStars(r.difficulte)}</div>
      ${r.dureePreparation ? `<div><b>Préparation :</b> ${r.dureePreparation} min</div>` : ""}
      ${r.dureeCuisson ? `<div><b>Cuisson :</b> ${r.dureeCuisson} min</div>` : ""}
      ${r.repos ? `<div><b>Repos / marinade :</b> ${escapeHtml(r.repos)}</div>` : ""}
      ${total ? `<div><b>Total (hors repos) :</b> ${total} min</div>` : ""}
    </div>

    ${(r.ingredients || []).length ? `<div class="section">
      <h2>Ingrédients</h2>
      <div class="portions" style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap">
        <span style="color:var(--muted)">Pour</span>
        <button class="btn small" type="button" id="portMinus" aria-label="moins">−</button>
        <input id="portInput" type="number" min="1" step="1" value="${basePortions}"
          style="width:64px;text-align:center;padding:6px;border:1px solid var(--border);border-radius:8px" />
        <button class="btn small" type="button" id="portPlus" aria-label="plus">+</button>
        <span style="color:var(--muted)">personne(s)</span>
        <button class="btn small" type="button" id="portReset" style="margin-left:4px">↺ Référence (${basePortions})</button>
      </div>
      <ul class="ingredients" id="ingredientsList"></ul>
    </div>` : ""}

    ${(r.etapesPreparation || []).length ? `<div class="section">
      <h2>Préparation</h2>
      <ol class="steps">${r.etapesPreparation.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>
    </div>` : ""}

    ${(r.etapesCuisson || []).length ? `<div class="section">
      <h2>Cuisson</h2>
      ${r.etapesCuisson.map(cuissonStep).join("")}
    </div>` : ""}

    ${r.commentaires ? `<div class="section">
      <h2>Commentaires</h2>
      <div class="comment-box">${escapeHtml(r.commentaires)}</div>
    </div>` : ""}
  `;
  $("#content").innerHTML = html;
  setupPortions();
}

async function init() {
  if (!id) { $("#content").innerHTML = '<div class="empty">Recette introuvable.</div>'; return; }
  const res = await fetch(`/api/recipes/${encodeURIComponent(id)}`);
  if (!res.ok) { $("#content").innerHTML = '<div class="empty">Recette introuvable.</div>'; return; }
  const r = await res.json();
  render(r);

  // Boutons admin si connecté
  try {
    const me = await (await fetch("/api/me")).json();
    if (me.admin) {
      $("#navActions").innerHTML = `
        <a class="btn" href="/">← Retour</a>
        <a class="btn" href="/admin.html?id=${encodeURIComponent(id)}">Modifier</a>
        <button class="btn danger" id="delBtn">Supprimer</button>`;
      $("#delBtn").addEventListener("click", delRecipe);
    }
  } catch (e) {}
}

init();

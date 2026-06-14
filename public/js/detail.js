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

function ingredient(i) {
  const q = [i.quantite, i.unite].filter(Boolean).join(" ");
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

function render(r) {
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
      ${total ? `<div><b>Total :</b> ${total} min</div>` : ""}
    </div>

    ${(r.ingredients || []).length ? `<div class="section">
      <h2>Ingrédients</h2>
      <ul class="ingredients">${r.ingredients.map(ingredient).join("")}</ul>
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

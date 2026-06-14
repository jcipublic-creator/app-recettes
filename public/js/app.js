// Page liste : chargement, filtres, recherche
let allRecipes = [];

const $ = (s) => document.querySelector(s);

function diffStars(n) {
  n = Number(n) || 1;
  let out = "";
  for (let i = 1; i <= 3; i++) {
    out += i <= n ? "●" : '<span class="off">●</span>';
  }
  return `<span class="diff" title="Difficulté ${n}/3">${out}</span>`;
}

function thumb(r) {
  const img = (r.medias || []).find((m) => m.type === "image");
  if (img) {
    return `<div class="thumb" style="background-image:url('${img.url.replace(/'/g, "%27")}')"></div>`;
  }
  return `<div class="thumb">🍽️</div>`;
}

function card(r) {
  const sub = r.sousCategorie ? `<span class="tag">${escapeHtml(r.sousCategorie)}</span>` : "";
  const total = (Number(r.dureePreparation) || 0) + (Number(r.dureeCuisson) || 0);
  const time = total ? `<span class="tag">⏱ ${total} min</span>` : "";
  return `<a class="card" href="/recette.html?id=${encodeURIComponent(r.id)}">
    ${thumb(r)}
    <div class="body">
      <div class="title">${escapeHtml(r.titre)}</div>
      <div class="meta">
        ${r.categorie ? `<span class="tag cat">${escapeHtml(r.categorie)}</span>` : ""}
        ${sub}${time}
        ${diffStars(r.difficulte)}
      </div>
    </div>
  </a>`;
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function render() {
  const q = $("#search").value.trim().toLowerCase();
  const cat = $("#filterCat").value;
  const sub = $("#filterSub").value;

  const filtered = allRecipes.filter((r) => {
    if (cat && r.categorie !== cat) return false;
    if (sub && r.sousCategorie !== sub) return false;
    if (q) {
      const hay = [
        r.titre, r.categorie, r.sousCategorie, r.commentaires,
        ...(r.ingredients || []).map((i) => i.nom),
      ].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  $("#grid").innerHTML = filtered.map(card).join("");
  $("#empty").style.display = filtered.length ? "none" : "block";
  if (allRecipes.length && !filtered.length) {
    $("#empty").textContent = "Aucune recette ne correspond à votre recherche.";
  }
}

function fillFilters() {
  const cats = [...new Set(allRecipes.map((r) => r.categorie).filter(Boolean))].sort();
  const subs = [...new Set(allRecipes.map((r) => r.sousCategorie).filter(Boolean))].sort();
  $("#filterCat").insertAdjacentHTML("beforeend",
    cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join(""));
  $("#filterSub").insertAdjacentHTML("beforeend",
    subs.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join(""));
}

async function init() {
  try {
    const res = await fetch("/api/recipes");
    allRecipes = await res.json();
  } catch (e) {
    allRecipes = [];
  }
  fillFilters();
  render();
  $("#search").addEventListener("input", render);
  $("#filterCat").addEventListener("change", render);
  $("#filterSub").addEventListener("change", render);

  // Masque le bouton Admin si pas connecté (optionnel : il reste accessible)
  try {
    const me = await (await fetch("/api/me")).json();
    if (me.admin) {
      $("#navActions").innerHTML = '<a class="btn primary" href="/admin.html">+ Nouvelle recette</a>';
    }
  } catch (e) {}
}

init();

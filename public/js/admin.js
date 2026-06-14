const $ = (s) => document.querySelector(s);
const editId = new URLSearchParams(location.search).get("id");

function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}

/* ---------- Lignes répétables ---------- */
function mediaRow(m = {}) {
  const div = document.createElement("div");
  div.className = "repeat-row";
  div.innerHTML = `
    <select style="flex:0 0 110px">
      <option value="image"${m.type !== "video" ? " selected" : ""}>Image</option>
      <option value="video"${m.type === "video" ? " selected" : ""}>Vidéo</option>
    </select>
    <input placeholder="URL du média" value="${m.url ? m.url.replace(/"/g, "&quot;") : ""}" />
    <button class="btn small danger" type="button">×</button>`;
  div.querySelector("button").onclick = () => div.remove();
  return div;
}

function ingredientRow(i = {}) {
  const div = document.createElement("div");
  div.className = "repeat-row";
  div.innerHTML = `
    <input style="flex:0 0 80px" placeholder="Qté" value="${i.quantite ?? ""}" />
    <input style="flex:0 0 90px" placeholder="Unité" value="${i.unite ?? ""}" />
    <input placeholder="Ingrédient" value="${i.nom ? i.nom.replace(/"/g, "&quot;") : ""}" />
    <button class="btn small danger" type="button">×</button>`;
  div.querySelector("button").onclick = () => div.remove();
  return div;
}

function prepRow(text = "") {
  const div = document.createElement("div");
  div.className = "repeat-row";
  div.innerHTML = `
    <textarea placeholder="Décrire l'étape" style="min-height:54px"></textarea>
    <button class="btn small danger" type="button">×</button>`;
  div.querySelector("textarea").value = text;
  div.querySelector("button").onclick = () => div.remove();
  return div;
}

function cuissonRow(s = {}) {
  const div = document.createElement("div");
  div.className = "repeat-row";
  div.style.flexWrap = "wrap";
  div.innerHTML = `
    <textarea placeholder="Description" style="flex:1 0 100%;min-height:48px"></textarea>
    <input style="flex:1 0 30%" placeholder="Température" value="${s.temperature ?? ""}" />
    <input style="flex:1 0 30%" placeholder="Mode (four, vapeur…)" value="${s.mode ?? ""}" />
    <input style="flex:1 0 20%" placeholder="Durée" value="${s.duree ?? ""}" />
    <button class="btn small danger" type="button">×</button>`;
  div.querySelector("textarea").value = s.description ?? "";
  div.querySelector("button").onclick = () => div.remove();
  return div;
}

const adders = {
  media: () => $("#medias").appendChild(mediaRow()),
  ingredient: () => $("#ingredients").appendChild(ingredientRow()),
  prep: () => $("#etapesPreparation").appendChild(prepRow()),
  cuisson: () => $("#etapesCuisson").appendChild(cuissonRow()),
};

document.querySelectorAll("[data-add]").forEach((btn) => {
  btn.onclick = () => adders[btn.dataset.add]();
});

/* ---------- Collecte du formulaire ---------- */
function collect() {
  const medias = [...$("#medias").children].map((row) => ({
    type: row.querySelector("select").value,
    url: row.querySelector("input").value.trim(),
  })).filter((m) => m.url);

  const ingredients = [...$("#ingredients").children].map((row) => {
    const [q, u, n] = row.querySelectorAll("input");
    return { quantite: q.value.trim(), unite: u.value.trim(), nom: n.value.trim() };
  }).filter((i) => i.nom);

  const etapesPreparation = [...$("#etapesPreparation").children]
    .map((row) => row.querySelector("textarea").value.trim()).filter(Boolean);

  const etapesCuisson = [...$("#etapesCuisson").children].map((row) => {
    const ta = row.querySelector("textarea");
    const [temp, mode, duree] = row.querySelectorAll("input");
    return {
      description: ta.value.trim(),
      temperature: temp.value.trim(),
      mode: mode.value.trim(),
      duree: duree.value.trim(),
    };
  }).filter((s) => s.description || s.temperature || s.mode || s.duree);

  return {
    titre: $("#titre").value.trim(),
    categorie: $("#categorie").value.trim(),
    sousCategorie: $("#sousCategorie").value.trim(),
    difficulte: Number($("#difficulte").value),
    portions: Number($("#portions").value) || 4,
    dureePreparation: Number($("#dureePreparation").value) || 0,
    dureeCuisson: Number($("#dureeCuisson").value) || 0,
    medias, ingredients, etapesPreparation, etapesCuisson,
    commentaires: $("#commentaires").value.trim(),
  };
}

async function save() {
  const data = collect();
  if (!data.titre) { showToast("Le titre est requis."); return; }
  const url = editId ? `/api/recipes/${editId}` : "/api/recipes";
  const method = editId ? "PUT" : "POST";
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (res.ok) {
    const saved = await res.json();
    location.href = `/recette.html?id=${encodeURIComponent(saved.id)}`;
  } else {
    const err = await res.json().catch(() => ({}));
    showToast(err.error || "Échec de l'enregistrement.");
  }
}

/* ---------- Upload Cloudinary direct ---------- */
// Envoie un fichier (File/Blob) vers Cloudinary avec une signature fraiche.
async function uploadFile(file) {
  if (!file) return;
  try {
    showToast("Upload en cours…");
    const sig = await (await fetch("/api/upload/signature")).json();
    if (!sig.signature) { showToast("Cloudinary non configuré."); return; }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", sig.apiKey);
    fd.append("timestamp", sig.timestamp);
    fd.append("signature", sig.signature);
    fd.append("folder", sig.folder);
    const up = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
      { method: "POST", body: fd }
    );
    const result = await up.json();
    if (result.secure_url) {
      const type = result.resource_type === "video" ? "video" : "image";
      $("#medias").appendChild(mediaRow({ type, url: result.secure_url }));
      showToast("Média ajouté.");
    } else {
      showToast("Upload échoué.");
    }
  } catch (e) {
    showToast("Upload échoué.");
  }
}

async function setupUpload() {
  try {
    // On verifie que Cloudinary est configure avant d'afficher les controles.
    const sig = await (await fetch("/api/upload/signature")).json();
    if (!sig.signature) return;

    // Bouton "Uploader un fichier"
    $("#uploadBtn").style.display = "inline-flex";
    $("#uploadBtn").onclick = () => $("#fileInput").click();
    $("#fileInput").onchange = (e) => {
      const file = e.target.files[0];
      if (file) uploadFile(file);
      e.target.value = "";
    };

    // Zone "Coller / glisser-deposer"
    const zone = $("#pasteZone");
    if (zone) {
      zone.style.display = "block";

      // Collage (Cmd+V) : actif quand la zone a le focus, ou globalement sur la page admin.
      const handlePaste = (e) => {
        const items = (e.clipboardData || {}).items || [];
        for (const it of items) {
          if (it.type && it.type.startsWith("image/")) {
            const blob = it.getAsFile();
            if (blob) { uploadFile(blob); e.preventDefault(); }
            return;
          }
        }
      };
      zone.addEventListener("paste", handlePaste);
      document.addEventListener("paste", handlePaste);
      zone.addEventListener("click", () => zone.focus());

      // Glisser-deposer
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.style.borderColor = "var(--accent)";
        zone.style.background = "#fbf7f0";
      });
      const reset = () => {
        zone.style.borderColor = "var(--border)";
        zone.style.background = "transparent";
      };
      zone.addEventListener("dragleave", reset);
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        reset();
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) uploadFile(file);
      });
    }
  } catch (e) { /* Cloudinary non configuré : on garde la saisie d'URL */ }
}

/* ---------- Initialisation ---------- */
function fillForm(r) {
  $("#formTitle").textContent = "Modifier la recette";
  $("#titre").value = r.titre || "";
  $("#categorie").value = r.categorie || "";
  $("#sousCategorie").value = r.sousCategorie || "";
  $("#difficulte").value = String(r.difficulte || 1);
  $("#portions").value = r.portions || 4;
  $("#dureePreparation").value = r.dureePreparation || "";
  $("#dureeCuisson").value = r.dureeCuisson || "";
  (r.medias || []).forEach((m) => $("#medias").appendChild(mediaRow(m)));
  (r.ingredients || []).forEach((i) => $("#ingredients").appendChild(ingredientRow(i)));
  (r.etapesPreparation || []).forEach((s) => $("#etapesPreparation").appendChild(prepRow(s)));
  (r.etapesCuisson || []).forEach((s) => $("#etapesCuisson").appendChild(cuissonRow(s)));
  $("#commentaires").value = r.commentaires || "";
}

async function loadCategories() {
  try {
    const cats = await (await fetch("/api/categories")).json();
    $("#catList").innerHTML = cats.map((c) => `<option value="${c}">`).join("");
  } catch (e) {}
}

function showLogin() {
  $("#loginView").style.display = "block";
  $("#formView").style.display = "none";
  $("#loginBtn").onclick = async () => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: $("#pwd").value }),
    });
    if (res.ok) { location.reload(); }
    else { $("#loginError").textContent = "Mot de passe incorrect."; }
  };
  $("#pwd").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#loginBtn").click(); });
  const toggle = $("#togglePwd");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const f = $("#pwd");
      const show = f.type === "password";
      f.type = show ? "text" : "password";
      toggle.textContent = show ? "🙈" : "👁";
      f.focus();
    });
  }
}

async function showForm() {
  $("#loginView").style.display = "none";
  $("#formView").style.display = "block";
  $("#logoutBtn").style.display = "inline-flex";
  $("#logoutBtn").onclick = async () => {
    await fetch("/api/logout", { method: "POST" });
    location.href = "/";
  };
  await loadCategories();
  await setupUpload();
  $("#saveBtn").onclick = save;

  if (editId) {
    const res = await fetch(`/api/recipes/${editId}`);
    if (res.ok) fillForm(await res.json());
  } else {
    // quelques lignes vides pour démarrer
    adders.ingredient();
    adders.prep();
  }
}

async function init() {
  const me = await (await fetch("/api/me")).json().catch(() => ({ admin: false }));
  if (me.admin) showForm();
  else showLogin();
}

init();

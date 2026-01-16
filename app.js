// Referencias DOM
const cardsContainer = document.getElementById("cardsContainer");
const deckList = document.getElementById("deckList");
const searchInput = document.getElementById("searchInput");
const editionFilter = document.getElementById("editionFilter");
const typeFilter = document.getElementById("typeFilter");
const costFilter = document.getElementById("costFilter");

// Estado
let allCards = [];
let currentDeck = {}; // { "id_carta": cantidad }
const MAX_COPIES = 3;

// 1. CARGAR DATOS
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("No se pudo cargar el JSON");
    
    let rawData = await response.json();

    // === CORRECCIÓN IMPORTANTE: GENERADOR DE IDs ===
    // Si las cartas no tienen ID, les asignamos uno basado en su posición (índice 0, 1, 2...)
    allCards = rawData.map((card, index) => ({
      ...card,
      // Si ya tiene id lo usa, si no, usa el índice numérico
      id: (card.id !== undefined && card.id !== null) ? card.id : index
    }));
    
    populateEditions(); // Llenar filtro de ediciones
    renderCards(allCards); // Mostrar cartas
    updateDeckView(); // Iniciar vista del mazo
    
  } catch (error) {
    console.error(error);
    cardsContainer.innerHTML = `<p class="empty-msg">Error: ${error.message}. Revisa la consola (F12).</p>`;
  }
});

// 2. RENDERIZAR CARTAS
function renderCards(cards) {
  cardsContainer.innerHTML = "";
  
  // Optimización: Mostrar solo las primeras 100 para no pegar el navegador si son muchas
  const displayCards = cards.slice(0, 100); 

  displayCards.forEach(card => {
    // Usamos el ID generado
    const qty = currentDeck[card.id] || 0;
    
    const cardEl = document.createElement("div");
    cardEl.className = "myl-card";
    // Pasamos el ID exacto a la función click
    cardEl.onclick = () => addToDeck(card.id);
    
    cardEl.innerHTML = `
      <img src="${card.imagen}" alt="${card.nombre}" loading="lazy">
      ${qty > 0 ? `<div class="card-count-badge">${qty}</div>` : ''}
      <div class="card-overlay">
        <strong>${card.nombre}</strong><br>
        <small>${card.tipo || 'Sin tipo'}</small>
      </div>
    `;
    cardsContainer.appendChild(cardEl);
  });

  if(cards.length === 0) {
    cardsContainer.innerHTML = `<p class="empty-msg">No se encontraron cartas.</p>`;
  }
}

// 3. FILTROS
function filterCards() {
  const text = searchInput.value.toLowerCase();
  const edition = editionFilter.value;
  const type = typeFilter.value;
  const cost = costFilter.value;

  const filtered = allCards.filter(card => {
    // Validamos que existan los campos antes de usar toLowerCase()
    const nombre = (card.nombre || "").toLowerCase();
    const habilidad = (card.habilidad || "").toLowerCase();
    const tipoCarta = card.tipo || "";
    const edicionCarta = card.edicion || ""; // Asumo que tu JSON tiene "edicion", si no, ajusta aquí

    // 1. Texto
    const matchText = nombre.includes(text) || habilidad.includes(text);
    
    // 2. Edición
    const matchEdition = edition === "all" || edicionCarta === edition;

    // 3. Tipo (Usamos includes para que "💰 Oro" coincida con "Oro")
    const matchType = type === "all" || tipoCarta.includes(type);

    // 4. Coste (Validamos que exista coste, si es null asumimos 0 o lo ignoramos según prefieras)
    let matchCost = true;
    const costeReal = card.coste !== undefined ? card.coste : -1; // -1 si no tiene coste

    if (cost !== "all") {
      if (cost === "4+") matchCost = costeReal >= 4;
      else matchCost = costeReal == cost;
    }

    return matchText && matchEdition && matchType && matchCost;
  });

  renderCards(filtered);
}

// Event Listeners
searchInput.addEventListener("input", filterCards);
editionFilter.addEventListener("change", filterCards);
typeFilter.addEventListener("change", filterCards);
costFilter.addEventListener("change", filterCards);

function populateEditions() {
  // Extraemos ediciones únicas, filtrando nulos
  const ediciones = [...new Set(allCards.map(c => c.edicion).filter(Boolean))];
  ediciones.forEach(ed => {
    const opt = document.createElement("option");
    opt.value = ed;
    opt.textContent = ed;
    editionFilter.appendChild(opt);
  });
}

// 4. LÓGICA DE MAZO
function addToDeck(id) {
  // Aseguramos que el ID se trate siempre como String para las claves del objeto
  const idStr = String(id);
  
  if (!currentDeck[idStr]) currentDeck[idStr] = 0;
  
  if (currentDeck[idStr] >= MAX_COPIES) {
    alert("Máximo 3 copias por carta.");
    return;
  }

  currentDeck[idStr]++;
  updateDeckView();
  
  // Re-filtrar para actualizar las bolitas de cantidad visualmente
  filterCards(); 
}

function removeFromDeck(id) {
  const idStr = String(id);
  if (currentDeck[idStr] > 0) {
    currentDeck[idStr]--;
    if (currentDeck[idStr] === 0) delete currentDeck[idStr];
    updateDeckView();
    filterCards();
  }
}

function updateDeckView() {
  deckList.innerHTML = "";
  let totalCards = 0;
  let stats = { Oro: 0, Aliado: 0, Otros: 0 };

  const ids = Object.keys(currentDeck);
  
  if (ids.length === 0) {
    deckList.innerHTML = `<p class="empty-msg">Tu mazo está vacío.</p>`;
    document.getElementById("cardCount").textContent = "0/50";
    document.getElementById("oroCount").textContent = "0";
    document.getElementById("aliadoCount").textContent = "0";
    document.getElementById("otroCount").textContent = "0";
    return;
  }

  ids.forEach(deckId => {
    // Buscamos comparando Strings para evitar error de tipos (1 vs "1")
    const card = allCards.find(c => String(c.id) === deckId);
    
    if (!card) return; // Si no la encuentra, salta para no romper la web

    const qty = currentDeck[deckId];
    totalCards += qty;

    // Conteo inteligente de Tipos (detecta emojis)
    const tipoLower = (card.tipo || "").toLowerCase();
    
    if (tipoLower.includes("oro")) stats.Oro += qty;
    else if (tipoLower.includes("aliado")) stats.Aliado += qty;
    else stats.Otros += qty;

    const item = document.createElement("div");
    item.className = "deck-card-item";
    item.innerHTML = `
      <div class="deck-card-info">
        <strong>${card.nombre}</strong>
        <small>${card.tipo || ''}</small>
      </div>
      <div style="display:flex; gap:10px; align-items:center;">
        <span style="font-weight:bold;">x${qty}</span>
        <button class="remove-btn" onclick="removeFromDeck('${deckId}')">➖</button>
      </div>
    `;
    deckList.appendChild(item);
  });

  document.getElementById("cardCount").textContent = `${totalCards}/50`;
  document.getElementById("oroCount").textContent = stats.Oro;
  document.getElementById("aliadoCount").textContent = stats.Aliado;
  document.getElementById("otroCount").textContent = stats.Otros;
}

function limpiarMazo() {
  if(confirm("¿Borrar todo el mazo?")) {
    currentDeck = {};
    updateDeckView();
    filterCards();
  }
}

function exportarMazo() {
  let texto = "Mi Mazo MyL:\n";
  Object.keys(currentDeck).forEach(id => {
    const card = allCards.find(c => String(c.id) === id);
    if(card) texto += `${currentDeck[id]}x ${card.nombre}\n`;
  });
  navigator.clipboard.writeText(texto).then(() => alert("Lista copiada al portapapeles!"));
}

// UI Mobile
const deckSidebar = document.getElementById("deckSidebar");
const openDeckBtn = document.getElementById("openDeckBtn");
const toggleDeckBtn = document.getElementById("toggleDeckBtn");

if(openDeckBtn) {
    openDeckBtn.addEventListener("click", () => deckSidebar.classList.add("open"));
}
if(toggleDeckBtn) {
    toggleDeckBtn.addEventListener("click", () => deckSidebar.classList.remove("open"));
}
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
    // ASUMO QUE TU ARCHIVO SE LLAMA 'data.json' Y ESTÁ EN LA MISMA CARPETA
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("No se pudo cargar el JSON");
    
    allCards = await response.json();
    
    // Llenar filtro de ediciones dinámicamente
    populateEditions();
    
    // Render inicial
    renderCards(allCards);
    updateDeckView();
  } catch (error) {
    console.error(error);
    cardsContainer.innerHTML = `<p class="empty-msg">Error cargando cartas. Asegúrate de tener 'data.json'.</p>`;
  }
});

// 2. RENDERIZAR CARTAS
function renderCards(cards) {
  cardsContainer.innerHTML = "";
  
  // Limite visual para rendimiento si son muchas (lazy loading casero)
  const displayCards = cards.slice(0, 100); 

  displayCards.forEach(card => {
    const qty = currentDeck[card.id] || 0;
    
    const cardEl = document.createElement("div");
    cardEl.className = "myl-card";
    cardEl.onclick = () => addToDeck(card.id);
    
    cardEl.innerHTML = `
      <img src="${card.imagen}" alt="${card.nombre}" loading="lazy">
      ${qty > 0 ? `<div class="card-count-badge">${qty}</div>` : ''}
      <div class="card-overlay">
        <strong>${card.nombre}</strong><br>
        <small>${card.tipo} - ${card.coste !== null ? card.coste : '-'}</small>
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
    // Filtro Texto
    const matchText = card.nombre.toLowerCase().includes(text) || 
                      (card.habilidad && card.habilidad.toLowerCase().includes(text));
    
    // Filtro Edición
    const matchEdition = edition === "all" || card.edicion === edition;

    // Filtro Tipo
    const matchType = type === "all" || card.tipo === type;

    // Filtro Coste
    let matchCost = true;
    if (cost !== "all") {
      if (cost === "4+") matchCost = card.coste >= 4;
      else matchCost = card.coste == cost;
    }

    return matchText && matchEdition && matchType && matchCost;
  });

  renderCards(filtered);
}

// Event Listeners para filtros
searchInput.addEventListener("input", filterCards);
editionFilter.addEventListener("change", filterCards);
typeFilter.addEventListener("change", filterCards);
costFilter.addEventListener("change", filterCards);

function populateEditions() {
  const ediciones = [...new Set(allCards.map(c => c.edicion))];
  ediciones.forEach(ed => {
    const opt = document.createElement("option");
    opt.value = ed;
    opt.textContent = ed;
    editionFilter.appendChild(opt);
  });
}

// 4. LÓGICA DE MAZO
function addToDeck(id) {
  if (!currentDeck[id]) currentDeck[id] = 0;
  
  // Reglas básicas
  if (currentDeck[id] >= MAX_COPIES) {
    alert("Máximo 3 copias por carta.");
    return;
  }

  currentDeck[id]++;
  updateDeckView();
  // Re-render solo la carta afectada sería mejor, pero por simpleza:
  filterCards(); 
}

function removeFromDeck(id) {
  if (currentDeck[id] > 0) {
    currentDeck[id]--;
    if (currentDeck[id] === 0) delete currentDeck[id];
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
  }

  ids.forEach(id => {
    const card = allCards.find(c => c.id == id);
    const qty = currentDeck[id];
    totalCards += qty;

    // Stats
    if (card.tipo === "Oro") stats.Oro += qty;
    else if (card.tipo === "Aliado") stats.Aliado += qty;
    else stats.Otros += qty;

    const item = document.createElement("div");
    item.className = "deck-card-item";
    item.innerHTML = `
      <div class="deck-card-info">
        <strong>${card.nombre}</strong>
        <small>${card.tipo}</small>
      </div>
      <div style="display:flex; gap:10px; align-items:center;">
        <span style="font-weight:bold;">x${qty}</span>
        <button class="remove-btn" onclick="removeFromDeck('${id}')">➖</button>
      </div>
    `;
    deckList.appendChild(item);
  });

  // Actualizar UI
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
    const card = allCards.find(c => c.id == id);
    texto += `${currentDeck[id]}x ${card.nombre}\n`;
  });
  navigator.clipboard.writeText(texto).then(() => alert("Lista copiada al portapapeles!"));
}

// UI Mobile
const deckSidebar = document.getElementById("deckSidebar");
document.getElementById("openDeckBtn").addEventListener("click", () => {
  deckSidebar.classList.add("open");
});
document.getElementById("toggleDeckBtn").addEventListener("click", () => {
  deckSidebar.classList.remove("open");
});
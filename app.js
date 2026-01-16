// Referencias DOM
const container = document.getElementById("mainContainer");
const searchInput = document.getElementById("searchInput");
const editionFilter = document.getElementById("editionFilter");
const typeFilter = document.getElementById("typeFilter");
const costFilter = document.getElementById("costFilter");

// Referencias MODAL
const modal = document.getElementById("cardModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalType = document.getElementById("modalType");
const modalEdition = document.getElementById("modalEdition");
const modalCost = document.getElementById("modalCost");
const modalForce = document.getElementById("modalForce");
const modalAbility = document.getElementById("modalAbility");

let allCards = [];

// 1. CARGAR DATOS
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("Error cargando data.json");
    
    let rawData = await response.json();

    // PROCESAR DATA (Detectar Edición por URL)
    allCards = rawData.map((card, index) => {
      let edicion = "Otras";
      if (card.imagen) {
        const match = card.imagen.match(/PRIMER_BLOQUE\/([^\/]+)\//);
        if (match && match[1]) {
          edicion = match[1].replace(/^\d+[-_]/, "").replace(/[-_]/g, " ");
          edicion = capitalizar(edicion);
        }
      }

      return {
        ...card,
        id: (card.id !== undefined) ? card.id : index,
        edicionCalculada: edicion
      };
    });

    populateEditions();
    renderGroupedCards(allCards);

  } catch (error) {
    console.error(error);
    container.innerHTML = `<p class="empty-msg">Error: ${error.message}</p>`;
  }
});

function capitalizar(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

function populateEditions() {
  const edicionesUnicas = [...new Set(allCards.map(c => c.edicionCalculada))].sort();
  edicionesUnicas.forEach(ed => {
    const option = document.createElement("option");
    option.value = ed;
    option.textContent = ed;
    editionFilter.appendChild(option);
  });
}

// 2. RENDERIZAR AGRUPADO CON EVENTO CLICK
function renderGroupedCards(cards) {
  container.innerHTML = "";

  if (cards.length === 0) {
    container.innerHTML = `<p class="empty-msg">No se encontraron cartas.</p>`;
    return;
  }

  const grupos = {};
  cards.forEach(card => {
    const ed = card.edicionCalculada;
    if (!grupos[ed]) grupos[ed] = [];
    grupos[ed].push(card);
  });

  const nombresEdiciones = Object.keys(grupos).sort();

  nombresEdiciones.forEach(nombreEdicion => {
    const cartasGrupo = grupos[nombreEdicion];

    const section = document.createElement("section");
    section.className = "edition-section";

    section.innerHTML = `
      <div class="edition-title">
        ${nombreEdicion}
        <span class="edition-count">${cartasGrupo.length}</span>
      </div>
    `;

    const grid = document.createElement("div");
    grid.className = "cards-grid";

    cartasGrupo.forEach(card => {
      const cardDiv = document.createElement("div");
      cardDiv.className = "myl-card";
      
      // ✅ Al hacer clic, abrimos el modal
      cardDiv.onclick = () => openModal(card);

      cardDiv.innerHTML = `
        <img src="${card.imagen}" loading="lazy" alt="${card.nombre}">
      `;
      grid.appendChild(cardDiv);
    });

    section.appendChild(grid);
    container.appendChild(section);
  });
}

// 3. FUNCIONES DEL MODAL
function openModal(card) {
  // Llenar datos
  modalImage.src = card.imagen;
  modalTitle.textContent = card.nombre;
  modalType.textContent = card.tipo || "Carta";
  modalEdition.textContent = card.edicionCalculada;
  
  // Manejo de valores nulos o vacíos
  modalCost.textContent = (card.coste !== undefined && card.coste !== null) ? card.coste : "-";
  modalForce.textContent = (card.fuerza !== undefined && card.fuerza !== null) ? card.fuerza : "-";
  modalAbility.textContent = card.habilidad ? card.habilidad : "Sin habilidad.";

  // Mostrar modal
  modal.classList.add("active");
}

function closeModal() {
  modal.classList.remove("active");
  setTimeout(() => { modalImage.src = ""; }, 200); // Limpiar imagen al cerrar
}

// Eventos para cerrar modal
closeModalBtn.addEventListener("click", closeModal);

// Cerrar si se hace clic fuera del contenido (en el fondo oscuro)
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Cerrar con tecla Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("active")) {
    closeModal();
  }
});

// 4. FILTROS
function applyFilters() {
  const text = searchInput.value.toLowerCase();
  const edition = editionFilter.value;
  const type = typeFilter.value;
  const cost = costFilter.value;

  const filtered = allCards.filter(card => {
    const nombre = (card.nombre || "").toLowerCase();
    const habilidad = (card.habilidad || "").toLowerCase();
    const tipoCarta = (card.tipo || "").toLowerCase();
    
    const matchText = nombre.includes(text) || habilidad.includes(text);
    const matchEdition = edition === "all" || card.edicionCalculada === edition;
    const matchType = type === "all" || tipoCarta.includes(type.toLowerCase());
    
    let matchCost = true;
    const coste = card.coste !== undefined ? card.coste : -1;
    if (cost !== "all") {
      if (cost === "4+") matchCost = coste >= 4;
      else matchCost = coste == cost;
    }

    return matchText && matchEdition && matchType && matchCost;
  });

  renderGroupedCards(filtered);
}

searchInput.addEventListener("input", applyFilters);
editionFilter.addEventListener("change", applyFilters);
typeFilter.addEventListener("change", applyFilters);
costFilter.addEventListener("change", applyFilters);
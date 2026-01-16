// Referencias
const container = document.getElementById("mainContainer");
const searchInput = document.getElementById("searchInput");
const editionFilter = document.getElementById("editionFilter"); // <--- Nuevo
const typeFilter = document.getElementById("typeFilter");
const costFilter = document.getElementById("costFilter");

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
        // Regex para sacar la carpeta de la URL
        const match = card.imagen.match(/PRIMER_BLOQUE\/([^\/]+)\//);
        if (match && match[1]) {
          // Limpieza: "03-Helenica" -> "Helenica"
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

    // Llenar el select de ediciones antes de renderizar
    populateEditions();
    
    // Render inicial
    renderGroupedCards(allCards);

  } catch (error) {
    console.error(error);
    container.innerHTML = `<p class="empty-msg">Error: ${error.message}</p>`;
  }
});

function capitalizar(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

// 2. FUNCIÓN PARA LLENAR EL FILTRO DE EDICIONES
function populateEditions() {
  const edicionesUnicas = [...new Set(allCards.map(c => c.edicionCalculada))].sort();
  
  edicionesUnicas.forEach(ed => {
    const option = document.createElement("option");
    option.value = ed;
    option.textContent = ed;
    editionFilter.appendChild(option);
  });
}

// 3. RENDERIZAR AGRUPADO
function renderGroupedCards(cards) {
  container.innerHTML = "";

  if (cards.length === 0) {
    container.innerHTML = `<p class="empty-msg">No se encontraron cartas.</p>`;
    return;
  }

  // Agrupar
  const grupos = {};
  cards.forEach(card => {
    const ed = card.edicionCalculada;
    if (!grupos[ed]) grupos[ed] = [];
    grupos[ed].push(card);
  });

  // Ordenar grupos alfabéticamente
  const nombresEdiciones = Object.keys(grupos).sort();

  // Crear secciones
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
      cardDiv.title = `${card.nombre} (${card.tipo || 'Carta'})`;
      
      cardDiv.innerHTML = `
        <img src="${card.imagen}" loading="lazy" alt="${card.nombre}">
      `;
      grid.appendChild(cardDiv);
    });

    section.appendChild(grid);
    container.appendChild(section);
  });
}

// 4. FILTROS (Ahora incluye Edición)
function applyFilters() {
  const text = searchInput.value.toLowerCase();
  const edition = editionFilter.value; // <--- Leemos el valor
  const type = typeFilter.value;
  const cost = costFilter.value;

  const filtered = allCards.filter(card => {
    const nombre = (card.nombre || "").toLowerCase();
    const habilidad = (card.habilidad || "").toLowerCase();
    const tipoCarta = (card.tipo || "").toLowerCase();
    
    // Filtro Texto
    const matchText = nombre.includes(text) || habilidad.includes(text);
    
    // Filtro Edición (NUEVO)
    const matchEdition = edition === "all" || card.edicionCalculada === edition;

    // Filtro Tipo
    const matchType = type === "all" || tipoCarta.includes(type.toLowerCase());
    
    // Filtro Coste
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

// Eventos
searchInput.addEventListener("input", applyFilters);
editionFilter.addEventListener("change", applyFilters); // <--- Evento agregado
typeFilter.addEventListener("change", applyFilters);
costFilter.addEventListener("change", applyFilters);
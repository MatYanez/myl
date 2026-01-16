// Referencias
const container = document.getElementById("mainContainer"); // Ojo: Cambié el ID en HTML a mainContainer
const searchInput = document.getElementById("searchInput");
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
      
      // Lógica de extracción de carpeta
      if (card.imagen) {
        // Busca texto entre "PRIMER_BLOQUE/" y el siguiente "/"
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

    renderGroupedCards(allCards);

  } catch (error) {
    console.error(error);
    container.innerHTML = `<p class="empty-msg">Error: ${error.message}</p>`;
  }
});

function capitalizar(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

// 2. RENDERIZAR AGRUPADO
function renderGroupedCards(cards) {
  container.innerHTML = "";

  if (cards.length === 0) {
    container.innerHTML = `<p class="empty-msg">No se encontraron cartas.</p>`;
    return;
  }

  // A. Agrupar cartas por edición
  const grupos = {};
  cards.forEach(card => {
    const ed = card.edicionCalculada;
    if (!grupos[ed]) grupos[ed] = [];
    grupos[ed].push(card);
  });

  // B. Ordenar nombres de ediciones (opcional)
  const nombresEdiciones = Object.keys(grupos).sort();

  // C. Crear secciones HTML
  nombresEdiciones.forEach(nombreEdicion => {
    const cartasGrupo = grupos[nombreEdicion];

    // Contenedor de la Sección
    const section = document.createElement("section");
    section.className = "edition-section";

    // Título de la Edición
    section.innerHTML = `
      <div class="edition-title">
        ${nombreEdicion}
        <span class="edition-count">${cartasGrupo.length}</span>
      </div>
    `;

    // Grilla de cartas
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

// 3. FILTROS
function applyFilters() {
  const text = searchInput.value.toLowerCase();
  const type = typeFilter.value;
  const cost = costFilter.value;

  const filtered = allCards.filter(card => {
    const nombre = (card.nombre || "").toLowerCase();
    const habilidad = (card.habilidad || "").toLowerCase();
    const tipoCarta = (card.tipo || "").toLowerCase();
    
    // Filtro Texto
    const matchText = nombre.includes(text) || habilidad.includes(text);
    // Filtro Tipo
    const matchType = type === "all" || tipoCarta.includes(type.toLowerCase());
    // Filtro Coste
    let matchCost = true;
    const coste = card.coste !== undefined ? card.coste : -1;
    if (cost !== "all") {
      if (cost === "4+") matchCost = coste >= 4;
      else matchCost = coste == cost;
    }

    return matchText && matchType && matchCost;
  });

  renderGroupedCards(filtered);
}

// Eventos
searchInput.addEventListener("input", applyFilters);
typeFilter.addEventListener("change", applyFilters);
costFilter.addEventListener("change", applyFilters);
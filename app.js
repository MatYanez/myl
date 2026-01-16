// Referencias DOM
const cardsContainer = document.getElementById("cardsContainer");
const searchInput = document.getElementById("searchInput");
const editionFilter = document.getElementById("editionFilter");
const typeFilter = document.getElementById("typeFilter");
const costFilter = document.getElementById("costFilter");

// Estado
let allCards = [];

// 1. CARGAR DATOS
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("No se pudo cargar data.json");
    
    let rawData = await response.json();

    // PROCESAMIENTO DE DATA
    allCards = rawData.map((card, index) => {
      // 1. Generar ID si falta
      const id = (card.id !== undefined && card.id !== null) ? card.id : index;
      
      // 2. Extraer Edición desde la URL
      let edicionDetectada = "Desconocida";
      
      if (card.imagen) {
        // Buscamos lo que está después de "PRIMER_BLOQUE/"
        // Regex captura: .../PRIMER_BLOQUE/ (GRUPO 1: Carpeta) / ...
        const match = card.imagen.match(/PRIMER_BLOQUE\/([^\/]+)\//);
        
        if (match && match[1]) {
          let folderName = match[1]; 
          // Ejemplo: "03-Helenica" o "07-Dominios-de-RA"
          
          // Quitamos números iniciales seguidos de guion (ej: "03-")
          folderName = folderName.replace(/^\d+[-_]/, ""); 
          
          // Reemplazamos guiones y guiones bajos por espacios
          folderName = folderName.replace(/[-_]/g, " ");
          
          // Convertimos "RA" a "Ra" por estética (opcional, capitalizar palabras)
          edicionDetectada = capitalizar(folderName);
        }
      }

      return {
        ...card,
        id: id,
        edicionCalculada: edicionDetectada // Guardamos la edición limpia aquí
      };
    });
    
    populateEditions();
    renderCards(allCards);
    
  } catch (error) {
    console.error(error);
    cardsContainer.innerHTML = `<p style="text-align:center; padding:20px;">Error cargando datos: ${error.message}</p>`;
  }
});

// Función auxiliar para títulos (ej: "dominios de ra" -> "Dominios De Ra")
function capitalizar(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

// 2. RENDERIZAR
function renderCards(cards) {
  cardsContainer.innerHTML = "";
  // Lazy render simple: limitamos a 200 para no saturar si hay miles
  const displayCards = cards.slice(0, 200); 

  displayCards.forEach(card => {
    const cardEl = document.createElement("div");
    cardEl.className = "myl-card";
    
    // Título hover con datos
    cardEl.title = `${card.nombre} \nEdición: ${card.edicionCalculada}`;

    cardEl.innerHTML = `
      <img src="${card.imagen}" alt="${card.nombre}" loading="lazy">
      <div class="card-info-overlay">
        <strong>${card.edicionCalculada}</strong>
      </div>
    `;
    cardsContainer.appendChild(cardEl);
  });

  if(cards.length === 0) {
    cardsContainer.innerHTML = `<p style="text-align:center; width:100%; color:#888;">No se encontraron cartas.</p>`;
  }
}

// 3. FILTROS
function filterCards() {
  const text = searchInput.value.toLowerCase();
  const edition = editionFilter.value;
  const type = typeFilter.value;
  const cost = costFilter.value;

  const filtered = allCards.filter(card => {
    const nombre = (card.nombre || "").toLowerCase();
    const habilidad = (card.habilidad || "").toLowerCase();
    const tipoCarta = (card.tipo || ""); // Sin lowerCase aún para respetar mayúsculas si es necesario, o usar includes
    
    // 1. Texto
    const matchText = nombre.includes(text) || habilidad.includes(text);
    
    // 2. Edición (Usamos la calculada)
    const matchEdition = edition === "all" || card.edicionCalculada === edition;

    // 3. Tipo (Flexible con emojis)
    const matchType = type === "all" || tipoCarta.toLowerCase().includes(type.toLowerCase());

    // 4. Coste
    let matchCost = true;
    const costeReal = card.coste !== undefined ? card.coste : -1;
    if (cost !== "all") {
      if (cost === "4+") matchCost = costeReal >= 4;
      else matchCost = costeReal == cost;
    }

    return matchText && matchEdition && matchType && matchCost;
  });

  renderCards(filtered);
}

// Eventos
searchInput.addEventListener("input", filterCards);
editionFilter.addEventListener("change", filterCards);
typeFilter.addEventListener("change", filterCards);
costFilter.addEventListener("change", filterCards);

// Llenar select de Ediciones
function populateEditions() {
  // Obtenemos ediciones únicas del campo calculado
  const ediciones = [...new Set(allCards.map(c => c.edicionCalculada))].sort();
  
  ediciones.forEach(ed => {
    if (ed === "Desconocida") return; // Opcional: Ocultar desconocidas
    const opt = document.createElement("option");
    opt.value = ed;
    opt.textContent = ed;
    editionFilter.appendChild(opt);
  });
}
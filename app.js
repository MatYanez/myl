function updateDeckView() {
  deckList.innerHTML = "";
  let totalCards = 0;
  let stats = { Oro: 0, Aliado: 0, Otros: 0 };

  const ids = Object.keys(currentDeck);
  
  if (ids.length === 0) {
    deckList.innerHTML = `<p class="empty-msg">Tu mazo está vacío.</p>`;
    // Reseteamos contadores visuales
    document.getElementById("cardCount").textContent = "0/50";
    document.getElementById("oroCount").textContent = "0";
    document.getElementById("aliadoCount").textContent = "0";
    document.getElementById("otroCount").textContent = "0";
    return;
  }

  ids.forEach(id => {
    // CORRECCIÓN 1: Convertimos ambos a String para asegurar la comparación (evita error número vs texto)
    const card = allCards.find(c => String(c.id) === String(id));
    
    // CORRECCIÓN 2: Seguridad. Si por alguna razón no encuentra la carta, la saltamos para no romper la web.
    if (!card) {
      console.warn("Carta no encontrada en la base de datos con ID:", id);
      return; 
    }

    const qty = currentDeck[id];
    totalCards += qty;

    // Stats (Usamos toLowerCase para evitar errores si dice "aliado" o "Aliado")
    const tipoNormalizado = (card.tipo || "").toLowerCase(); // Previene error si tipo no existe
    
    if (tipoNormalizado === "oro") stats.Oro += qty;
    else if (tipoNormalizado === "aliado") stats.Aliado += qty;
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
document.addEventListener("DOMContentLoaded", () => {
  console.log("[liveSearch.js] loaded");
  const searchKey = document.getElementById("search-key");
  const searchBtn = document.getElementById("search-btn");
  const resultsGrid = document.getElementById("results-grid");
  const noResults = document.getElementById("no-results");

  async function fetchGames() {
    console.log("[liveSearch.js] fetchGames()", {
      kw: searchKey.value,
      genres: [
        ...document.querySelectorAll('input[name="genres"]:checked'),
      ].map((cb) => cb.value),
      ages: [...document.querySelectorAll('input[name="ages"]:checked')].map(
        (cb) => cb.value
      ),
      minP: document.querySelector('input[name="minPlayers"]').value,
      maxP: document.querySelector('input[name="maxPlayers"]').value,
    });
    const params = new URLSearchParams();

    if (searchKey.value.trim())
      params.append("keywords", searchKey.value.trim());
    document
      .querySelectorAll('input[name="genres"]:checked')
      .forEach((cb) => params.append("genres", cb.value));
    document
      .querySelectorAll('input[name="ages"]:checked')
      .forEach((cb) => params.append("ages", cb.value));
    const minP = document.querySelector('input[name="minPlayers"]').value;
    const maxP = document.querySelector('input[name="maxPlayers"]').value;
    if (minP) params.append("minPlayers", minP);
    if (maxP) params.append("maxPlayers", maxP);

    const url = "/api/games?" + params;
    console.log("[liveSearch.js] requesting", url);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const games = await res.json();
      console.log("[liveSearch.js] received", games.length, "games");
      resultsGrid.innerHTML = "";
      if (games.length === 0) {
        noResults.style.display = "block";
      } else {
        noResults.style.display = "none";
        games.forEach((g) => {
          const card = document.createElement("div");
          card.className = "card";
          card.innerHTML = `
            <a href="/game/${g.IDJeu}">
              <img src="${g.Image}" alt="${g.NomJeu}">
              <div class="title">${g.NomJeu}</div>
            </a>`;
          resultsGrid.appendChild(card);
        });
      }
    } catch (err) {
      console.error("[liveSearch.js] fetch error:", err);
    }
  }

  // déclencheurs
  searchKey.addEventListener("input", fetchGames);
  searchBtn.addEventListener("click", fetchGames);
  document
    .querySelectorAll(".filter-options input")
    .forEach((inp) => inp.addEventListener("change", fetchGames));

  // initial
  fetchGames();
});

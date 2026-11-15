const $ = (s) => document.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function poster(g, cls = "") {
  const hue = [...g.slug].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `<div class="poster ${cls}" style="--h:${hue}">
    <img src="${esc(g.poster)}" alt="${esc(g.title)} poster" loading="lazy" onerror="this.remove()">
    <span class="poster-title">${esc(g.title)}</span></div>`;
}

function card(g) {
  return `<a class="card" href="game.html?g=${encodeURIComponent(g.slug)}">
    ${poster(g)}
    <div class="card-body"><h3>${esc(g.title)}</h3>
    <p>${esc(g.tagline)}</p><small>${esc(g.status)} · ${esc(g.genre)}</small></div></a>`;
}

function chrome() {
  const here = location.pathname.split("/").pop() || "index.html";
  const link = (h, t) => `<a href="${h}" ${here === h ? 'aria-current="page"' : ''}>${t}</a>`;
  $("#header").innerHTML = `<a class="brand" href="index.html">${esc(STUDIO.name)}</a>
    <nav>${link("index.html", "Home")}${link("games.html", "Our games")}<a href="index.html#about">About</a></nav>`;
  $("#footer").innerHTML = `<p>© ${new Date().getFullYear()} ${esc(STUDIO.name)}</p>
    <p>${STUDIO.socials.map(s => `<a href="${esc(s.url)}">${esc(s.label)}</a>`).join(" ")}
    <a href="mailto:${esc(STUDIO.contact)}">${esc(STUDIO.contact)}</a></p>`;
  document.title = document.title.replace("{studio}", STUDIO.name);
}

function home() {
  $("#studio-name").textContent = STUDIO.name;
  $("#studio-tagline").textContent = STUDIO.tagline;
  $("#about-text").textContent = STUDIO.about;
  $("#featured").innerHTML = poster(GAMES[0], "big");
  $("#featured-link").href = "game.html?g=" + GAMES[0].slug;
  $("#featured-link").textContent = "See " + GAMES[0].title;
  $("#grid").innerHTML = GAMES.slice(0, 6).map(card).join("");
}

function gamesPage() { $("#grid").innerHTML = GAMES.map(card).join(""); }

function gamePage() {
  const slug = new URLSearchParams(location.search).get("g");
  const g = GAMES.find(x => x.slug === slug);
  if (!g) { $("#game").innerHTML = `<h1>Game not found</h1><p><a href="games.html">Back to all games</a></p>`; return; }
  document.title = g.title + " | " + STUDIO.name;
  $("#game").innerHTML = `
    <div class="game-head">${poster(g, "big")}
      <div><h1>${esc(g.title)}</h1><p class="lead">${esc(g.tagline)}</p>
        <dl><dt>Status</dt><dd>${esc(g.status)}</dd><dt>Genre</dt><dd>${esc(g.genre)}</dd>
        <dt>Platforms</dt><dd>${g.platforms.map(esc).join(", ")}</dd></dl>
        <a class="btn" href="${esc(g.itch)}">Download on itch.io</a></div></div>
    <div class="game-body"><section><h2>About</h2>${g.description.split("\n\n").map(p => `<p>${esc(p)}</p>`).join("")}</section>
      ${g.features.length ? `<section><h2>Features</h2><ul>${g.features.map(f => `<li>${esc(f)}</li>`).join("")}</ul></section>` : ""}
      ${g.screenshots.length ? `<section><h2>Screenshots</h2><div class="shots">${g.screenshots.map(s => `<img src="${esc(s)}" alt="${esc(g.title)} screenshot" loading="lazy">`).join("")}</div></section>` : ""}
    </div>
    <p><a href="games.html">Back to all games</a></p>`;
}

chrome();
({ home, games: gamesPage, game: gamePage })[document.body.dataset.page]();

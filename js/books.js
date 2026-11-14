// ==========================================================================
// BOOKS: the shelf (screen 2), click-to-zoom, and the hero book that travels to the shelf
// Edit the BOOKS list to change what sits on the shelf. 6 slots: 3 per compartment.
//   img  = cover file in Assets/covers/        { empty: true } = a "your cover here" placeholder
// ==========================================================================
(() => {
const BOOKS = [
  { id: "talentless-perspective", title: "Talentless Perspective", by: "Bobby1z", tag: "Full cover + title lettering",
    img: "../Assets/covers/talentless-perspective.webp",
    desc: "A character-led cover: a half-hidden face behind a carved axe on a bold orange field. The metallic title lettering carries the steel and fire colours through the whole design." },
  { id: "cold-steel-mac", title: "Cold Steel Mac", by: "Alistair MacAoigh", tag: "Full cover + title lettering",
    img: "../Assets/covers/cold-steel-mac.webp",
    desc: "A brass-armoured war machine towers over a white-haired fighter beneath a violet lightning storm. Warm metal against a cold purple sky, with the golden title set low to anchor the scene." },
  { id: "lapsed-lease", title: "Lapsed Lease", by: "RJ Verret", tag: "Past Due: Book 1",
    img: "../Assets/covers/lapsed-lease.webp",
    desc: "A lone fighter faces a many-faced monster under a burning dusk sky. The title sits inside a violet targeting-ring motif that ties the dark fantasy scene together." },
  { id: "first-date-oblivion", title: "First Date: Oblivion", by: "Bryce Garrison", tag: "Full cover + title lettering",
    img: "../Assets/covers/first-date-oblivion.webp",
    desc: "A bright, adventurous cover: a grinning miner with a crackling blue pickaxe stands in a glowing crystal cave, daylight pouring in behind him. The warm golden lettering picks up the cave's orange glow." },
  { id: "soldier-system", title: "Soldier System", by: "", tag: "Full cover + title lettering",
    img: "../Assets/covers/soldier-system.webp",
    desc: "A glitch-green, game-interface cover: a hooded, gas-masked soldier glares out from behind floating status screens. The pixel-broken title lettering sells the system-fiction genre at a glance." },
  { id: "pirate-archmage-pee-za-sauce", title: "Pirate Archmage Pee Za Sauce", by: "", tag: "Quest for the God Pizza",
    img: "../Assets/covers/pirate-archmage-pee-za-sauce.webp",
    desc: "A playful, high-energy cover: a pirate-hatted tomato character, a fox-eared knight and an elf with a mushroom staff on a warm, pizza-patterned backdrop. The banner-style title stays readable even as a thumbnail." },
];

const $ = (s, r = document) => r.querySelector(s);
const html = document.documentElement;
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Build the shelf ----------
const rows = [...document.querySelectorAll(".comp")];
const bookBtns = BOOKS.map((b, i) => {
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "book"; btn.dataset.i = i; btn.dataset.cursor = "Open";
  btn.setAttribute("aria-label", b.empty ? "Open: your cover could sit here" : `Open ${b.title}`);
  btn.innerHTML = b.empty
    ? `<span class="bkc bkc--empty"><i>+</i><b>Your cover<br>here</b></span>`
    : `<span class="bkc"><img src="${b.img}" alt="${b.title} cover"></span>`;
  rows[Math.floor(i / 3)]?.append(btn);
  return btn;
});

// ---------- Zoom ----------
const zoom = $("#zoom"), zb = $(".zoom-book"), zi = $(".zoom-info"), bd = $(".zoom-backdrop");
let openBtn = null, openRectEl = null, openKind = "", closing = false, lx = 0, ly = 0;
addEventListener("pointermove", e => { lx = e.clientX; ly = e.clientY; }, { passive: true });
// the cursor ring decides its label on mouse move, so nudge it once the layer under a still mouse has changed
const refreshCursor = () => requestAnimationFrame(() => document.elementFromPoint(lx, ly)?.dispatchEvent(new PointerEvent("pointermove", { clientX: lx, clientY: ly, bubbles: true })));

function layout(kind) {
  if (kind === "wide") {                                   // title lettering: big picture, text underneath
    let w = Math.min(innerWidth * 0.8, 980), h = w / 1.6; const maxH = innerHeight * 0.5;
    if (h > maxH) { h = maxH; w = h * 1.6; }
    const ih = 230, gap = 26, x = (innerWidth - w) / 2, y = (innerHeight - (h + gap + ih)) / 2;
    return { x, y, w, h, ix: x, iy: y + h + gap, iw: w, ih };
  }
  const h = Math.min(innerHeight * 0.78, 760), w = h * 2 / 3, gap = 56, iw = Math.min(440, innerWidth * 0.34);
  const x = (innerWidth - (w + gap + iw)) / 2, y = (innerHeight - h) / 2;
  return { x, y, w, h, ix: x + w + gap, iy: y, iw, ih: h };
}
function openZoom(src, rectEl, coverHTML, infoHTML, kind = "") {
  if (openBtn || closing) return;
  const r = rectEl.getBoundingClientRect(), L = layout(kind);
  openBtn = src; openRectEl = rectEl; openKind = kind; html.classList.add("zoomed");
  zb.innerHTML = coverHTML; zi.innerHTML = infoHTML; zi.classList.toggle("zoom-info--wide", kind === "wide");
  Object.assign(zb.style, { left: L.x + "px", top: L.y + "px", width: L.w + "px", height: L.h + "px" });
  Object.assign(zi.style, { left: L.ix + "px", top: L.iy + "px", width: L.iw + "px", height: L.ih + "px" });
  requestAnimationFrame(() => { const d = $(".zoom-desc", zi); if (d) d.classList.toggle("scrolls", d.scrollHeight > d.clientHeight + 1); }); // only a scrollable text gets the soft fade
  zoom.classList.add("open"); zoom.setAttribute("aria-hidden", "false"); src.classList.add("away"); refreshCursor();
  zb.animate([{ transform: `translate(${r.left - L.x}px,${r.top - L.y}px) scale(${r.width / L.w})` }, { transform: "none" }], { duration: calm ? 1 : 650, easing: "cubic-bezier(.22,1,.36,1)" });
  bd.animate([{ opacity: 0 }, { opacity: 1 }], { duration: calm ? 1 : 450, fill: "forwards" });
  zi.animate([{ opacity: 0, transform: "translateX(30px)" }, { opacity: 1, transform: "none" }], { duration: calm ? 1 : 700, delay: calm ? 0 : 250, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" });
}
const infoFor = b => b.empty
  ? `<p class="zoom-kicker">Waiting for a story</p><h3 class="zoom-title">Your cover here</h3><p class="zoom-desc">This spot on the shelf is waiting for your book. Start an order and your cover will stand right here.</p><a class="contact" href="Order.html">Start an order</a>`
  : `<p class="zoom-kicker">${b.tag}</p><h3 class="zoom-title">${b.title}</h3>${b.by ? `<p class="zoom-by">by ${b.by}</p>` : ""}<p class="zoom-desc">${b.desc}</p><a class="contact" href="Order.html?type=cover&like=${b.id}">Order a cover like this</a>`;
function openBook(btn) {
  const b = BOOKS[+btn.dataset.i];
  openZoom(btn, $(".bkc", btn), $(".bkc", btn).outerHTML, infoFor(b));
}
// Any element with data-open-book="<id>" (the Portfolio cards) opens the same zoom
document.querySelectorAll("[data-open-book]").forEach(el => {
  const open = () => { const b = BOOKS.find(x => x.id === el.dataset.openBook); if (b) openZoom(el, $(".bkc", el), $(".bkc", el).outerHTML, infoFor(b)); };
  el.addEventListener("click", open);
  el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
});
// Review cards: click to read the full review next to the book it was written about
function openReview(card) {
  const b = BOOKS.find(x => x.id === card.dataset.book); if (!b) return;
  openZoom($(".b3--mini", card), $(".b3--mini", card), `<span class="bkc"><img src="${b.img}" alt="${b.title} cover"></span>`,
    `<p class="zoom-kicker">Client review · Fiverr · 5.0</p><h3 class="zoom-title zoom-title--sm">${$("figcaption b", card).textContent}</h3><p class="zoom-desc zoom-desc--review">${$("blockquote", card).innerHTML}</p><a class="contact" href="Order.html">Order a cover</a>`);
}
document.querySelectorAll(".rcard").forEach(card => {
  card.tabIndex = 0; card.setAttribute("role", "button");
  card.addEventListener("click", () => openReview(card));
  card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openReview(card); } });
});
// Title lettering: click a card to open it large, click anywhere else to close
const TYPES = {
  "cold-steel-mac": { title: "Cold Steel Mac", desc: "Chiselled golden fantasy lettering with sharp serifs and a molten highlight. Heroic and weighty, set low so the art above it can breathe." },
  "talentless-perspective": { title: "Talentless Perspective", desc: "Metallic display lettering that fades from silver to fire orange, wrapped in thorned flourishes and a crest-like ornament." },
  "lapsed-lease": { title: "Lapsed Lease", desc: "Tall, sharp-cut capitals in warm cream fading to copper, centred inside a violet targeting-ring motif." },
  "first-date-oblivion": { title: "First Date: Oblivion", desc: "Bold serif capitals in a glowing gold-orange. Friendly, optimistic and easy to read, with the author name set above." },
  "soldier-system": { title: "Soldier System", desc: "Glitch-broken neon-green lettering that reads like a game interface, paired with a wide-spaced author line." },
  "pirate-archmage-pee-za-sauce": { title: "Pirate Archmage Pee Za Sauce", desc: "A banner-style title: big cream capitals over a red-brown ribbon with a pirate-hat crest, plus a subtitle scroll. Playful, but still readable as a thumbnail." },
};
function openType(card) {
  const t = TYPES[card.dataset.title]; if (!t) return;
  openZoom(card, card, `<span class="bkc bkc--wide"><img src="${$("img", card).src}" alt="${t.title} title lettering"></span>`,
    `<p class="zoom-kicker">Title lettering</p><h3 class="zoom-title zoom-title--sm">${t.title}</h3><p class="zoom-desc">${t.desc}</p><a class="contact" href="Order.html?type=title">Order custom lettering</a>`, "wide");
}
document.querySelectorAll(".tcard").forEach(card => {
  card.addEventListener("click", () => openType(card));
  card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openType(card); } });
});
function closeBook() {
  if (!openBtn || closing) return;
  closing = true;
  const r = openRectEl.getBoundingClientRect(), L = layout(openKind), d = calm ? 1 : 500;
  const a = zb.animate([{ transform: "none" }, { transform: `translate(${r.left - L.x}px,${r.top - L.y}px) scale(${r.width / L.w})` }], { duration: d, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" });
  bd.animate([{ opacity: 1 }, { opacity: 0 }], { duration: d, fill: "forwards" });
  zi.animate([{ opacity: 1 }, { opacity: 0 }], { duration: calm ? 1 : 250, fill: "forwards" });
  a.onfinish = () => {
    zoom.classList.remove("open"); zoom.setAttribute("aria-hidden", "true");
    [zb, zi, bd].forEach(e => e.getAnimations().forEach(x => x.cancel()));
    openBtn.classList.remove("away"); openBtn = null; openRectEl = null; openKind = ""; closing = false; html.classList.remove("zoomed"); refreshCursor();
  };
}
bookBtns.forEach(btn => btn.addEventListener("click", () => openBook(btn)));
zoom.addEventListener("click", e => { if (!e.target.closest(".zoom-book, .zoom-info")) closeBook(); }); // click anywhere else = unzoom
addEventListener("keydown", e => e.key === "Escape" && closeBook());
addEventListener("resize", () => { if (openBtn) { closing = false; zoom.classList.remove("open"); openBtn.classList.remove("away"); openBtn = null; openRectEl = null; html.classList.remove("zoomed"); } });

// ---------- Hero: mouse tilt on the three books ----------
const hero = $(".Home_page1"), hb = $(".hero-books");
if (hero && hb && !calm && matchMedia("(pointer: fine)").matches) {
  hero.addEventListener("pointermove", e => {
    const r = hero.getBoundingClientRect();
    hb.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 2 - 1).toFixed(2));
    hb.style.setProperty("--my", ((e.clientY - r.top) / r.height * 2 - 1).toFixed(2));
  }, { passive: true });
  hero.addEventListener("pointerleave", () => { hb.style.setProperty("--mx", 0); hb.style.setProperty("--my", 0); });
}

// ---------- The carried book: a fixed copy of the hero book follows the scroll into its spot on the shelf ----------
const src = $(".b3[data-fly]"), target = src && bookBtns[BOOKS.findIndex(b => b.id === src.dataset.fly)], shelf = $("#shelf");
if (src && target && shelf && !calm) {
  const flyer = src.cloneNode(true);
  flyer.classList.add("flyer"); flyer.removeAttribute("data-fly"); flyer.setAttribute("aria-hidden", "true");
  document.body.append(flyer);
  const update = () => {
    if (!src.offsetParent) { flyer.style.display = "none"; return; }       // phones: no hero books, nothing to carry
    const shelfTop = Math.round(shelf.getBoundingClientRect().top + scrollY - 60);
    const p = Math.max(0, Math.min(1, scrollY / shelfTop));
    const a = src.getBoundingClientRect(), c = $(".bkc", target).getBoundingClientRect();
    const x0 = a.left, y0 = a.top + scrollY, w0 = a.width;                    // where the book rests on the hero
    const x1 = c.left, y1 = c.top + scrollY - shelfTop, w1 = c.width;         // where it rests on the shelf
    const on = p > 0.001 && p < 0.999;
    flyer.style.display = on ? "block" : "none";
    src.classList.toggle("flying", on);
    target.classList.toggle("reserve", on || p <= 0.001);
    if (!on) return;
    const s = (w0 + (w1 - w0) * p) / flyer.offsetWidth;
    flyer.style.transform = `translate(${x0 + (x1 - x0) * p}px,${y0 + (y1 - y0) * p}px) scale(${s})`;
    flyer.style.setProperty("--ry", String(parseFloat(getComputedStyle(src).getPropertyValue("--ry")) * (1 - p)));
    flyer.style.setProperty("--mx", hb?.style.getPropertyValue("--mx") || 0);
    flyer.style.setProperty("--my", hb?.style.getPropertyValue("--my") || 0);
  };
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();
}
})();
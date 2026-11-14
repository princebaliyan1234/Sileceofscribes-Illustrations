// SCROLLING for the Home page: one wheel notch = one screen, and horizontal rows slide one card/panel per notch.
// (The old tile showcase code was removed: screen 2 is now the bookshelf, see books.js)
const $ = s => document.querySelector(s);
const zoomed = () => document.documentElement.classList.contains("zoomed"); // a book is zoomed: scrolling is locked

// ---- Horizontal sections: build one scroll step per group of cards ----
// CSS decides how many cards are visible (--v) and how many cards one scroll moves (--per); the gap is read from the track.
document.querySelectorAll(".hpin").forEach(sec => {
  const track = sec.querySelector(".htrack"), cs = getComputedStyle(track);
  const v = +cs.getPropertyValue("--v") || 3, per = +cs.getPropertyValue("--per") || 1;
  const n = Math.max(1, Math.ceil(Math.max(0, track.children.length - v) / per) + 1);
  Object.assign(sec.dataset, { n, v, per });
  sec.querySelector(".hsteps").innerHTML = Array.from({ length: n }, (_, k) => `<div class="hstep" data-k="${k}"></div>`).join("");
});
const hio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const sec = e.target.closest(".hpin"), track = sec.querySelector(".htrack"), k = +e.target.dataset.k;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 16;
  const off = Math.min(k * +sec.dataset.per, track.children.length - +sec.dataset.v);
  track.style.transform = `translateX(${-off * (track.children[0].offsetWidth + gap)}px)`;
  sec.querySelector(".hbar i").style.width = ((k + 1) / sec.dataset.n * 100) + "%";
}), { rootMargin: "-50% 0px -50% 0px" });
document.querySelectorAll(".hstep").forEach(el => hio.observe(el));

// ---- One scroll = one screen (desktop only; phones and reduced-motion scroll normally) ----
const SCREENS = [...document.querySelectorAll(".Home_page1, .shelf-screen, .hstep, .pg-screen, .cta")];
const stepped = matchMedia("(min-width: 801px) and (prefers-reduced-motion: no-preference)");
const active = () => stepped.matches && SCREENS.length > 1;
const NAV = 60;
let busy = false, lastWheel = 0;
const tops = () => SCREENS.map(el => Math.round(el.getBoundingClientRect().top + scrollY - NAV));
const nearest = () => { const t = tops(); return t.reduce((b, v, k) => Math.abs(v - scrollY) < Math.abs(t[b] - scrollY) ? k : b, 0); };

function glide(to) {
  const from = scrollY, t0 = performance.now(), D = 850;
  busy = true;
  (function frame(now) {
    const k = Math.min(1, (now - t0) / D), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    scrollTo(0, from + (to - from) * e);
    if (k < 1) return requestAnimationFrame(frame);
    // Stay locked until the wheel/trackpad has been quiet for 150ms, so trackpad momentum can't trigger a second step
    (function release() { performance.now() - lastWheel > 150 ? busy = false : setTimeout(release, 50); })();
  })(t0);
}
function move(dir) {
  const i = nearest() + dir;
  if (i < 0 || i >= SCREENS.length) return;
  glide(tops()[i]);
}
addEventListener("wheel", e => {
  if (!active() || e.ctrlKey) return; // Ctrl + wheel is browser zoom
  if (zoomed() && e.target.closest(".zoom-desc")) return; // a long review/description scrolls on its own
  e.preventDefault();
  lastWheel = performance.now();
  if (!busy && !zoomed() && Math.abs(e.deltaY) > 4) move(Math.sign(e.deltaY));
}, { passive: false });
addEventListener("keydown", e => {
  if (!active() || /input|textarea|select/i.test(e.target.tagName)) return;
  const d = { ArrowDown: 1, PageDown: 1, " ": e.shiftKey ? -1 : 1, ArrowUp: -1, PageUp: -1 }[e.key];
  if (!d) return;
  e.preventDefault();
  if (!busy && !zoomed()) move(d);
});

// Other scripts (the Portfolio side rail) can ask the page to glide to a screen
window.SOS = { go: el => { const i = SCREENS.indexOf(el); if (i >= 0 && !busy) glide(tops()[i]); } };
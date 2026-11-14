// ---------- 1. Letter hover: split big headings into letters ----------
document.querySelectorAll(".Head1, .sc-title, .h-title, .cta-title").forEach(h => {
  h.setAttribute("aria-label", h.textContent.trim());
  (function walk(node) {
    [...node.childNodes].forEach(c => {
      if (c.nodeType === 1) return walk(c);
      if (c.nodeType !== 3) return;
      const f = document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (!part.trim()) return f.append(part);
        const w = document.createElement("span");
        w.className = "w"; w.setAttribute("aria-hidden", "true");
        [...part].forEach(ch => { const s = document.createElement("span"); s.className = "ch"; s.style.setProperty("--r", Math.random().toFixed(2)); s.textContent = ch; w.append(s); });
        f.append(w);
      });
      c.replaceWith(f);
    });
  })(h);
});

const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- 2. Dot + ring cursor (mouse only) ----------
if (matchMedia("(pointer: fine)").matches) {
  const root = document.documentElement;
  const ring = Object.assign(document.createElement("div"), { className: "cursor-ring", innerHTML: "<span></span>" });
  const dot = Object.assign(document.createElement("div"), { className: "cursor-dot" });
  const label = ring.firstChild;
  document.body.append(ring, dot);
  root.classList.add("has-cursor");
  document.querySelectorAll(".hcard").forEach(c => c.dataset.cursorHover = "");

  const EASE = still ? 1 : 0.14, GROW = 1.9;
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, scale = 1, want = 1, seen = false;

  addEventListener("pointermove", e => {
    mx = e.clientX; my = e.clientY;
    if (!seen) { seen = true; rx = mx; ry = my; root.classList.add("cursor-on"); }
    const t = e.target.closest?.("[data-cursor], a, button, [data-cursor-hover]");
    const text = t?.dataset.cursor || "";
    if (label.textContent !== text) label.textContent = text;
    ring.classList.toggle("has-label", !!text);
    ring.classList.toggle("is-hover", !!t && !text);
    want = t && !text ? GROW : 1;
  }, { passive: true });
  // after a scroll step the thing under a still mouse has changed: re-check it (updates the ring label)
  let scrollTimer;
  addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => document.elementFromPoint(mx, my)?.dispatchEvent(new PointerEvent("pointermove", { clientX: mx, clientY: my, bubbles: true })), 90);
  }, { passive: true });
  root.addEventListener("mouseleave", () => root.classList.remove("cursor-on"));
  root.addEventListener("mouseenter", () => seen && root.classList.add("cursor-on"));

  (function loop() {
    rx += (mx - rx) * EASE; ry += (my - ry) * EASE;
    scale += (want - scale) * 0.12;
    dot.style.transform = `translate3d(${mx}px,${my}px,0) translate(-50%,-50%)`;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%) scale(${scale})`;
    requestAnimationFrame(loop);
  })();
}

// ---------- 3. Dot-grid warp (hero + buy screen: every <canvas class="warp">) ----------
document.querySelectorAll(".warp").forEach(cv => {
  const ctx = cv.getContext("2d"), host = cv.parentElement, dpr = Math.min(devicePixelRatio, 2);
  const GAP = 26, REACH = 150, PUSH = 26, DOT = 1;   // PUSH: negative values suck the grid inward
  let tx = -999, ty = -999, cx = -999, cy = -999, w = 0, h = 0, run = false, raf = 0;

  const fit = () => {
    const r = host.getBoundingClientRect();
    w = r.width; h = r.height;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  };
  host.addEventListener("pointermove", e => { const r = host.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; }, { passive: true });
  host.addEventListener("pointerleave", () => { tx = ty = -999; });

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let x = GAP / 2; x < w; x += GAP) for (let y = GAP / 2; y < h; y += GAP) {
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1;
      const f = Math.max(0, Math.min(1, 1 - d / REACH)), push = f * f * PUSH;
      ctx.beginPath();
      ctx.arc(x + (dx / d) * push, y + (dy / d) * push, DOT + f * 2.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(224,182,228,${0.14 + f * 0.86})`;
      ctx.fill();
    }
  }
  function loop() {
    raf = 0;
    if (!run) return;
    cx += (tx - cx) * 0.15; cy += (ty - cy) * 0.15;
    draw();
    raf = requestAnimationFrame(loop);
  }
  new ResizeObserver(fit).observe(host);
  if (!still) new IntersectionObserver(([e]) => { run = e.isIntersecting; if (run && !raf) raf = requestAnimationFrame(loop); }).observe(host);
});

// ---------- 4. Entrance animations: replay when you scroll to a screen (never on load or reload) ----------
document.querySelectorAll(".htrack").forEach(t => [...t.children].forEach((c, k) => c.style.setProperty("--k", k)));
if (!still) {
  const html = document.documentElement;
  let armed = false; // ignore whatever is on screen while the page loads, so a reload stays still
  setTimeout(() => armed = true, 800);
  const io = new IntersectionObserver(es => es.forEach(e => {
    clearTimeout(e.target._t);
    if (!e.isIntersecting) e.target.classList.remove("in");
    else if (armed) e.target.classList.add("in");
  }), { threshold: 0.2 });
  document.querySelectorAll(".Home_page1, .shelf-screen, .pg-screen, .hstage, .cta").forEach(el => io.observe(el));
  // Only when you arrive by clicking a link (page curtain just lifted) does the hero play its intro
  if (html.classList.contains("arriving")) setTimeout(() => document.querySelector(".Home_page1")?.classList.add("in"), 650);
}

// ---------- 5. Page transitions: only on link clicks to another page ----------
if (!still) {
  const html = document.documentElement;
  addEventListener("pageshow", e => e.persisted && html.classList.remove("leaving"));
  document.addEventListener("click", e => {
    const a = e.target.closest?.("a[href]");
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== "_self") || a.hasAttribute("download") || a.origin !== location.origin) return;
    if (a.pathname === location.pathname && a.search === location.search) return; // same page or #hash links
    e.preventDefault();
    try { sessionStorage.setItem("arrive", "1"); } catch (_) {}
    html.classList.add("leaving");
    setTimeout(() => { location.href = a.href; }, 480);
  });
}

// ---------- 6. Infinite marquee: repeat the words until they are wider than the screen, then loop at a steady speed ----------
document.querySelectorAll(".plat .marquee-track").forEach(track => {
  const one = track.innerHTML, SPEED = 60; // px per second: lower = slower
  if (still) return;                       // reduced motion: keep it as one static, wrapping line
  const build = () => {
    track.innerHTML = one;
    for (let i = 0; i < 8 && track.scrollWidth < innerWidth * 1.2; i++) track.insertAdjacentHTML("beforeend", one);
    const half = track.scrollWidth;
    track.insertAdjacentHTML("beforeend", track.innerHTML);   // second identical half: the loop slides exactly -50%
    track.style.setProperty("--mq-time", half / SPEED + "s");
  };
  build();
  let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(build, 200); });
});
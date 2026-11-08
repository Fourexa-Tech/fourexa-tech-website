/* =====================================================
   FOUREXA TECH — SWARM REBUILD (particle engine)
   Canvas 2D, vanilla JS. Homepage only. Button-triggered.
===================================================== */
(() => {
  "use strict";
  if (window.__fxSwarmLoaded) return;
  window.__fxSwarmLoaded = true;

  function init() {
    if (document.body.dataset.page !== "home") return;
    if (document.getElementById("swarm-rebuild-trigger")) return;

    const reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    const RGB = ["49,208,255", "62,120,255", "138,92,255"]; // cyan, blue, violet
    // seconds: swarm -> assemble sections -> logo morph -> burst -> fade -> end
    const T = { swarm: 1.2, asm: 3.2, morph: 5.2, burst: 6.7, fade: 7.05, end: 7.7 };
    const ARROW = new Path2D("M0 0L0 17L4.6 13L7.8 20.5L10.8 19.2L7.7 12L13.2 12Z");

    const BAR = "h1 .line,h2,h3,h4,p,.need-q,nav.links a,.brand span,.foot-col h5,.foot-col a";
    const BOX = ".pillar-card,.problem-tile,.work-card,.p-step,.need-item,.faq-item,.hero-visual," +
      ".btn-primary,.btn-secondary,.industry-tag,.contact-panel,.nav-cta,.menu-btn,.why-item";

    /* ---------- DOM ---------- */
    const trigger = document.createElement("button");
    trigger.id = "swarm-rebuild-trigger";
    trigger.type = "button";
    trigger.innerHTML = '<span aria-hidden="true">\u2726</span> Rebuild this website';
    trigger.setAttribute("aria-label", "Watch the website rebuild itself");

    const overlay = document.createElement("div");
    overlay.id = "swarm-overlay";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Website rebuild animation");
    overlay.innerHTML =
      '<canvas id="swarm-canvas" aria-hidden="true"></canvas>' +
      '<div class="swarm-hud">' +
        '<div class="swarm-caption"><span class="swarm-dot"></span><span id="swarm-status">Activating swarm\u2026</span></div>' +
        '<button type="button" class="swarm-skip">Skip</button>' +
      "</div>" +
      '<div class="swarm-bar"><i></i></div>';
    document.body.append(trigger, overlay);

    const canvas = overlay.querySelector("#swarm-canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    const statusEl = overlay.querySelector("#swarm-status");
    const skipBtn = overlay.querySelector(".swarm-skip");
    const barFill = overlay.querySelector(".swarm-bar i");

    /* ---------- state ---------- */
    let running = false, raf = 0, t0 = 0, last = 0;
    let endTimer = 0, doneTimer = 0, resizeTimer = 0;
    let W = 0, H = 0, dpr = 1, N = 0;
    let px, py, vx, vy, bx, by, lx, ly, sz, orb, ang, spd, jit, act, col, mode, own, grp, order;
    let secs = [], secStart = [], cursors = [];
    let mapX0 = 0, mapW = 0, logoBox = null;
    let logoReady = false, burstFired = false, fading = false, lastMsg = "";

    /* ---------- glow sprites ---------- */
    function makeSprite(rgb) {
      const s = 64, c = document.createElement("canvas");
      c.width = c.height = s;
      const g = c.getContext("2d");
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, "rgba(255,255,255,1)");
      gr.addColorStop(0.16, "rgba(" + rgb + ",0.95)");
      gr.addColorStop(0.5, "rgba(" + rgb + ",0.26)");
      gr.addColorStop(1, "rgba(" + rgb + ",0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, s, s);
      return c;
    }
    const sprites = RGB.map(makeSprite);

    /* ---------- sizing ---------- */
    function resizeCanvas() {
      W = overlay.clientWidth || window.innerWidth;
      H = overlay.clientHeight || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, W < 640 ? 1.5 : 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#060810";
      ctx.fillRect(0, 0, W, H);
    }

    function pickCount() {
      let n = Math.round((W * H) / 1500);
      n = Math.max(380, Math.min(W < 640 ? 560 : 1100, n));
      const low = (navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 4) <= 2;
      return low ? Math.round(n * 0.7) : n;
    }

    /* ---------- read the real page layout ---------- */
    function pretty(sec) {
      let raw = sec.id;
      if (!raw) {
        raw = sec.classList.contains("hero") ? "hero"
          : sec.classList.contains("trust") ? "trust"
          : sec.tagName === "SECTION" ? "section"
          : sec.tagName.toLowerCase();
      }
      raw = raw.replace(/[-_]/g, " ");
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }

    function readPage() {
      const docW = document.documentElement.clientWidth || window.innerWidth;
      const list = [];
      const header = document.querySelector("body > header");
      const footer = document.querySelector("body > footer");
      if (header) list.push(header);
      document.querySelectorAll("main > section").forEach((s) => list.push(s));
      if (footer) list.push(footer);
      return list
        .map((sec) => {
          const sr = sec.getBoundingClientRect();
          const h = Math.max(sr.height, 1);
          const items = [];
          sec.querySelectorAll(BOX + "," + BAR).forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width < 18 || r.height < 6) return;
            items.push({
              box: el.matches(BOX),
              x: r.left / docW, y: (r.top - sr.top) / h,
              w: r.width / docW, h: r.height / h
            });
          });
          return { name: pretty(sec), h: sr.height, items };
        })
        .filter((s) => s.h > 10);
    }

    function boxPts(out, x, y, w, h, s, step) {
      const per = 2 * (w + h);
      const n = Math.max(6, Math.round(per / step));
      for (let k = 0; k < n; k++) {
        let d = (per * k) / n, X, Y;
        if (d < w) { X = x + d; Y = y; }
        else if ((d -= w) < h) { X = x + w; Y = y + d; }
        else if ((d -= h) < w) { X = x + w - d; Y = y + h; }
        else { d -= w; X = x; Y = y + h - d; }
        out.push({ x: X, y: Y, s });
      }
    }
    function barPts(out, x, y, w, s, step) {
      const n = Math.max(3, Math.round(w / step));
      for (let k = 0; k < n; k++) out.push({ x: x + (w * (k + 0.5)) / n, y, s });
    }

    // compress the whole page into one screen as a blueprint
    function buildTargets(sp) {
      const pages = readPage();
      mapW = Math.min(W * 0.9, 1040);
      mapX0 = (W - mapW) / 2;
      const pad = Math.max(64, H * 0.1);
      const gap = 5;
      const wts = pages.map((p) => Math.pow(p.h, 0.62));
      const sum = wts.reduce((a, b) => a + b, 0) || 1;
      const usable = Math.max(40, H - pad * 2 - gap * (pages.length - 1));
      const flat = [];
      let y = pad;
      secs = pages.map((p, si) => {
        const sh = Math.max(10, (usable * wts[si]) / sum);
        const i0 = flat.length;
        p.items.forEach((it) => {
          const rx = mapX0 + it.x * mapW;
          const rw = Math.max(4, it.w * mapW);
          const ry = y + Math.min(Math.max(it.y, 0), 1) * sh;
          const rh = Math.max(3, Math.min(it.h * sh, y + sh - ry));
          if (it.box) boxPts(flat, rx, ry, rw, rh, si, 11 * sp);
          else barPts(flat, rx, ry + rh / 2, rw, si, 13 * sp);
        });
        if (si < pages.length - 1) barPts(flat, mapX0, y + sh + gap / 2, mapW, si, 26 * sp);
        const sec = { name: p.name, y0: y, h: sh, i0, i1: flat.length };
        y += sh + gap;
        return sec;
      });
      return flat;
    }

    function assign(flat) {
      const M = flat.length;
      for (let k = 0; k < N; k++) {
        const i = order[k];
        const fi = M <= N ? (k < M ? k : -1) : Math.floor((k * M) / N);
        if (fi >= 0) {
          bx[i] = flat[fi].x; by[i] = flat[fi].y; grp[i] = flat[fi].s;
          act[i] = secStart[grp[i]] + jit[i] * 0.6;
        } else {
          grp[i] = -1;
        }
      }
    }

    function layout() {
      const first = buildTargets(1);
      const sp = Math.max(1, first.length / (N * 0.9));
      const flat = sp > 1 ? buildTargets(sp) : first;
      secStart = secs.map((s, i) => T.swarm + (i * T.asm) / Math.max(1, secs.length));
      assign(flat);
    }

    /* ---------- logo (text sampled from an offscreen canvas) ---------- */
    function buildLogo() {
      const lines = W < 640 ? ["FOUREXA", "TECH"] : ["FOUREXA TECH"];
      const fs = 120, lh = fs * 1.08;
      const font = "700 " + fs + 'px "Space Grotesk", system-ui, sans-serif';
      const off = document.createElement("canvas");
      const octx = off.getContext("2d", { willReadFrequently: true });
      octx.font = font;
      let maxW = 0;
      lines.forEach((l) => { maxW = Math.max(maxW, octx.measureText(l).width); });
      off.width = Math.ceil(maxW + 24);
      off.height = Math.ceil(lh * lines.length + 24);
      octx.font = font;
      octx.fillStyle = "#fff";
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      lines.forEach((l, i) => octx.fillText(l, off.width / 2, 12 + lh * (i + 0.5)));
      const data = octx.getImageData(0, 0, off.width, off.height).data;
      const scale = Math.min(W * 0.84, 880) / maxW;
      let step = 3, pts;
      do {
        pts = [];
        for (let y = 0; y < off.height; y += step)
          for (let x = 0; x < off.width; x += step)
            if (data[(y * off.width + x) * 4 + 3] > 120) pts.push([x, y]);
        step++;
      } while (pts.length > N * 1.4 && step < 40);
      const M = pts.length;
      if (!M) return;
      const cx = W / 2, cy = H / 2;
      for (let k = 0; k < N; k++) {
        const i = order[k];
        const p = pts[M >= N ? Math.floor((k * M) / N) : k % M];
        const j = M < N ? (Math.random() - 0.5) * 2 : 0;
        lx[i] = cx + (p[0] - off.width / 2) * scale + j;
        ly[i] = cy + (p[1] - off.height / 2) * scale + j;
      }
      const bw = maxW * scale, bh = lh * lines.length * scale;
      logoBox = { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh };
      logoReady = true;
    }

    /* ---------- allocation ---------- */
    function alloc() {
      px = new Float32Array(N); py = new Float32Array(N);
      vx = new Float32Array(N); vy = new Float32Array(N);
      bx = new Float32Array(N); by = new Float32Array(N);
      lx = new Float32Array(N); ly = new Float32Array(N);
      sz = new Float32Array(N); orb = new Float32Array(N);
      ang = new Float32Array(N); spd = new Float32Array(N);
      jit = new Float32Array(N); act = new Float32Array(N);
      col = new Uint8Array(N); mode = new Uint8Array(N); own = new Uint8Array(N);
      grp = new Int16Array(N);
      order = new Array(N);
      for (let i = 0; i < N; i++) order[i] = i;
      for (let i = N - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
      }
      for (let i = 0; i < N; i++) {
        const r = Math.random();
        px[i] = Math.random() * W; py[i] = Math.random() * H;
        vx[i] = (Math.random() - 0.5) * 160; vy[i] = (Math.random() - 0.5) * 160;
        sz[i] = 3.5 + Math.pow(Math.random(), 2) * 6.5;
        col[i] = r < 0.4 ? 0 : r < 0.75 ? 1 : 2;
        mode[i] = 0; own[i] = i % 4;
        orb[i] = 12 + Math.random() * 100;
        ang[i] = Math.random() * 6.283;
        spd[i] = (0.7 + Math.random() * 1.8) * (Math.random() < 0.5 ? -1 : 1);
        jit[i] = Math.random();
        grp[i] = -1;
      }
    }

    function initCursors() {
      cursors = [0, 1, 2, 0].map((c, i) => ({
        x: W * (0.15 + 0.23 * i), y: H * (i % 2 ? 0.3 : 0.7),
        vx: 0, vy: 0, gx: W / 2, gy: H / 2, c, ph: i * 1.9, alpha: 0
      }));
    }

    /* ---------- simulation ---------- */
    function curSec(t) {
      let s = 0;
      for (let k = 0; k < secStart.length; k++) if (t >= secStart[k]) s = k;
      return s;
    }

    function stepCursors(t, dt) {
      const s = t >= T.swarm && t < T.morph ? curSec(t) : 0;
      cursors.forEach((c, i) => {
        if (t < T.swarm) {
          c.gx = W / 2 + Math.cos(t * 1.3 + c.ph) * W * 0.3;
          c.gy = H / 2 + Math.sin(t * 1.7 + c.ph * 1.3) * H * 0.26;
        } else if (t < T.morph) {
          const sec = secs[s] || { y0: H / 2, h: 40 };
          c.gx = mapX0 + mapW * (0.14 + 0.24 * i) + Math.sin(t * 3 + c.ph) * 24;
          c.gy = sec.y0 + sec.h * (0.5 + 0.32 * Math.sin(t * 2.3 + c.ph));
        } else if (logoBox && t < T.burst) {
          const left = i === 0 || i === 3;
          c.gx = (left ? logoBox.x : logoBox.x + logoBox.w) + Math.sin(t * 2 + c.ph) * 10;
          c.gy = (i < 2 ? logoBox.y : logoBox.y + logoBox.h) + Math.cos(t * 2 + c.ph) * 10;
        }
        c.vx += ((c.gx - c.x) * 16 - c.vx * 7.5) * dt;
        c.vy += ((c.gy - c.y) * 16 - c.vy * 7.5) * dt;
        c.x += c.vx * dt; c.y += c.vy * dt;
        c.alpha = t < T.burst ? Math.min(1, t / 0.4) : Math.max(0, 1 - (t - T.burst) / 0.45);
      });
    }

    function step(t, dt) {
      if (t >= T.morph && !logoReady) buildLogo();
      if (t >= T.burst) burstFired = true;
      const cx = W / 2, cy = H / 2;
      for (let i = 0; i < N; i++) {
        let m = mode[i];
        if (burstFired && m !== 3) {
          m = mode[i] = 3;
          const dx = px[i] - cx, dy = py[i] - cy, dist = Math.hypot(dx, dy) || 1;
          const imp = 380 + Math.random() * 620;
          vx[i] += (dx / dist) * imp; vy[i] += (dy / dist) * imp;
        } else if (logoReady && m < 2 && t >= T.morph + jit[i] * 0.45) {
          m = mode[i] = 2;
          const fx = (lx[i] - logoBox.x) / logoBox.w;
          col[i] = fx < 0.34 ? 0 : fx < 0.68 ? 1 : 2;
        } else if (m === 0 && grp[i] >= 0 && t >= act[i]) {
          m = mode[i] = 1;
        }
        let gx, gy, k, dmp;
        if (m === 0) {
          const c = cursors[own[i]];
          const a = ang[i] + t * spd[i];
          gx = c.x + Math.cos(a) * orb[i];
          gy = c.y + Math.sin(a) * orb[i] * 0.72;
          k = 2.6; dmp = 1.9;
        } else if (m === 1) {
          gx = bx[i] + Math.sin(t * 2.1 + i) * 0.8;
          gy = by[i] + Math.cos(t * 1.9 + i) * 0.8;
          k = 13; dmp = 6.2;
        } else if (m === 2) {
          gx = lx[i] + Math.sin(t * 2.1 + i) * 0.8;
          gy = ly[i] + Math.cos(t * 1.9 + i) * 0.8;
          k = 12; dmp = 6;
        } else {
          gx = px[i]; gy = py[i]; k = 0; dmp = 0.9;
        }
        vx[i] += (gx - px[i]) * k * dt;
        vy[i] += (gy - py[i]) * k * dt;
        const fr = Math.exp(-dmp * dt);
        vx[i] *= fr; vy[i] *= fr;
        px[i] += vx[i] * dt; py[i] += vy[i] * dt;
      }
      stepCursors(t, dt);
    }

    /* ---------- rendering ---------- */
    function draw(t) {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(6,8,16,0.24)"; // fade = motion trails
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < N; i++) {
        const r = sz[i];
        ctx.drawImage(sprites[col[i]], px[i] - r, py[i] - r, r * 2, r * 2);
      }
      cursors.forEach((c) => {
        if (c.alpha <= 0.01) return;
        ctx.globalAlpha = c.alpha;
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(sprites[c.c], c.x - 34, c.y - 34, 68, 68);
        ctx.globalCompositeOperation = "source-over";
        ctx.save();
        ctx.translate(c.x - 1, c.y - 1);
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "rgba(" + RGB[c.c] + ",1)";
        ctx.lineWidth = 1.6;
        ctx.lineJoin = "round";
        ctx.fill(ARROW);
        ctx.stroke(ARROW);
        ctx.restore();
      });
      ctx.globalAlpha = 1;
      if (t >= T.burst && t < T.burst + 0.6) {
        const p = (t - T.burst) / 0.6;
        const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7 * p + 1);
        g.addColorStop(0, "rgba(180,220,255," + (0.5 * (1 - p)).toFixed(3) + ")");
        g.addColorStop(1, "rgba(62,120,255,0)");
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    }

    function ui(t) {
      barFill.style.transform = "scaleX(" + Math.min(1, t / T.end).toFixed(3) + ")";
      let msg;
      if (t < T.swarm) msg = "Swarm activated\u2026";
      else if (t < T.morph) msg = "Assembling " + (secs[curSec(t)] ? secs[curSec(t)].name.toLowerCase() : "layout") + "\u2026";
      else if (t < T.burst) msg = "Forging the FOUREXA identity\u2026";
      else msg = "Going live\u2026";
      if (msg !== lastMsg) { statusEl.textContent = msg; lastMsg = msg; }
    }

    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const t = Math.max(0, (now - t0) / 1000);
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      step(t, dt);
      draw(t);
      ui(t);
      if (t >= T.fade && !fading) {
        fading = true;
        overlay.classList.add("leaving"); // fades out and stops blocking clicks
        release();                         // scrolling is usable again immediately
      }
      if (t >= T.end) finish();
    }

    /* ---------- lifecycle ---------- */
    function release() {
      document.documentElement.classList.remove("swarm-lock");
    }

    function onKey(e) {
      if (e.key === "Escape") finish();
      else if (e.key === "Tab") { e.preventDefault(); skipBtn.focus({ preventScroll: true }); }
    }

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!running) return;
        resizeCanvas();
        layout();
        if (logoReady) buildLogo();
      }, 160);
    }

    function runStatic() { // prefers-reduced-motion: no movement, short hold
      for (let i = 0; i < N; i++) {
        mode[i] = 1;
        if (grp[i] < 0) { bx[i] = Math.random() * W; by[i] = Math.random() * H; }
        px[i] = bx[i]; py[i] = by[i];
      }
      cursors.forEach((c) => { c.alpha = 0; });
      draw(0);
      statusEl.textContent = "Website rebuilt";
      barFill.style.transform = "scaleX(1)";
      endTimer = setTimeout(finish, 1600);
    }

    function start() {
      if (running) return;
      running = true; fading = false; burstFired = false; logoReady = false; lastMsg = "";
      clearTimeout(doneTimer);
      try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch (e) { window.scrollTo(0, 0); }
      document.documentElement.classList.add("swarm-lock");
      overlay.classList.remove("leaving");
      overlay.hidden = false;
      resizeCanvas();
      N = pickCount();
      alloc();
      layout();
      initCursors();
      document.addEventListener("keydown", onKey);
      window.addEventListener("resize", onResize);
      skipBtn.focus({ preventScroll: true });
      if (reduceMQ.matches) { runStatic(); return; }
      t0 = last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function finish() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(endTimer);
      clearTimeout(resizeTimer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      release();
      overlay.classList.add("leaving");
      doneTimer = setTimeout(() => {
        overlay.hidden = true;
        overlay.classList.remove("leaving");
      }, 700);
      trigger.focus({ preventScroll: true });
    }

    trigger.addEventListener("click", start);
    skipBtn.addEventListener("click", finish);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
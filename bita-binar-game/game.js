(() => {
const $ = s => document.querySelector(s);
const cv = $('#cv'), ctx = cv.getContext('2d');
const W = 840, H = 672, U = 42, OX = W / 2, OY = H / 2, NX = 10, NY = 8;
const C = { red: '#e04440', blue: '#3b79d1', green: '#4b9a7c', yellow: '#f0b120', orange: '#e8870e' };

/* ---------- util ---------- */
const f = n => String(n).replace('-', '−');
const PT = (n, p) => `${n}(${f(p.x)}; ${f(p.y)})`;
const px = p => [OX + p.x * U, OY - p.y * U];
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[rnd(0, a.length - 1)];

const IMG = {};
['standing', 'thinking', 'wow', 'teaching', 'waving', 'cheer', 'front', 'side_r', 'side_l'].forEach(n => {
  const i = new Image(); i.src = `assets/${n}.png`; i.onload = () => draw(); IMG[n] = i;
});

/* ---------- level ---------- */
const LV = [
  { name: 'Cermin sumbu-Y', types: ['y'], n: 5, rule: '(x, y) → (−x, y)', tip: 'Tanda x berubah, y tetap. Bita pindah ke seberang sumbu-Y.', ex: 'P(3; 2) → P′(−3; 2)' },
  { name: 'Cermin sumbu-X', types: ['x'], n: 5, rule: '(x, y) → (x, −y)', tip: 'Tanda y berubah, x tetap. Bita terbalik atas-bawah di seberang sumbu-X.', ex: 'P(3; 2) → P′(3; −2)' },
  { name: 'Garis x = k', types: ['xk'], n: 5, rule: '(x, y) → (2k − x, y)', tip: 'Cermin berdiri tegak di x = k. Hitung jarak x ke garis, lalu pindah sejauh itu ke seberang.', ex: 'Garis x = 2, P(−1; 3) → P′(5; 3)' },
  { name: 'Garis y = k', types: ['yk'], n: 5, rule: '(x, y) → (x, 2k − y)', tip: 'Cermin berbaring di y = k. Hitung jarak y ke garis, lalu pindah sejauh itu ke seberang.', ex: 'Garis y = 1, P(2; 4) → P′(2; −2)' },
  { name: 'Tantangan campuran', types: ['y', 'x', 'xk', 'yk', 'd'], n: 6, rule: 'Garis y = x: (x, y) → (y, x)', tip: 'Cerminnya bisa apa saja. Baca dulu jenis cermin di soal, lalu pilih aturan yang cocok.', ex: 'Garis y = x, P(1; 4) → P′(4; 1)' }
];

/* ---------- cermin ---------- */
const mName = m => ({ y: 'sumbu-Y', x: 'sumbu-X', xk: `garis x = ${f(m.k)}`, yk: `garis y = ${f(m.k)}`, d: 'garis y = x' })[m.t];
const ruleOf = m => ({ y: '(x, y) → (−x, y)', x: '(x, y) → (x, −y)', xk: `(x, y) → (2k − x, y), k = ${f(m.k)}`, yk: `(x, y) → (x, 2k − y), k = ${f(m.k)}`, d: '(x, y) → (y, x)' })[m.t];
const foot = (p, m) => m.t == 'y' ? { x: 0, y: p.y } : m.t == 'x' ? { x: p.x, y: 0 } : m.t == 'xk' ? { x: m.k, y: p.y } : m.t == 'yk' ? { x: p.x, y: m.k } : { x: (p.x + p.y) / 2, y: (p.x + p.y) / 2 };
const refl = (p, m) => { const q = foot(p, m); return { x: 2 * q.x - p.x, y: 2 * q.y - p.y }; };
const horiz = m => m.t != 'x' && m.t != 'yk';
const explain = q => {
  const { x, y } = q.p, m = q.m, a = q.a;
  return m.t == 'y' ? `x′ = −(${f(x)}) = ${f(a.x)}, y′ = ${f(y)}`
    : m.t == 'x' ? `x′ = ${f(x)}, y′ = −(${f(y)}) = ${f(a.y)}`
    : m.t == 'xk' ? `x′ = 2·${f(m.k)} − (${f(x)}) = ${f(a.x)}, y′ = ${f(y)}`
    : m.t == 'yk' ? `x′ = ${f(x)}, y′ = 2·${f(m.k)} − (${f(y)}) = ${f(a.y)}`
    : `x′ = y = ${f(a.x)}, y′ = x = ${f(a.y)}`;
};

function gen(l) {
  const t = pick(LV[l].types), m = { t };
  if (t == 'xk' || t == 'yk') m.k = pick([-4, -3, -2, -1, 1, 2, 3, 4]);
  for (let i = 0; i < 300; i++) {
    const p = { x: rnd(-8, 8), y: rnd(-6, 6) }, a = refl(p, m);
    if (Math.hypot(a.x - p.x, a.y - p.y) >= 3 && Math.abs(a.x) <= 9 && Math.abs(a.y) <= 7) {
      const h = horiz(m), face = h ? pick(['side_r', 'side_l']) : 'front';
      return { m, p, a, name: pick('ABCDEFGHKLMNPQRST'.split('')), face, aface: h ? (face == 'side_r' ? 'side_l' : 'side_r') : 'front', fy: !h, tries: 0, hint: false, sel: null, done: false };
    }
  }
  return gen(l);
}

/* ---------- state ---------- */
let S = { stars: [0, 0, 0, 0, 0] };
try { S = JSON.parse(localStorage.getItem('bita-refleksi')) || S; } catch (e) {}
const save = () => { try { localStorage.setItem('bita-refleksi', JSON.stringify(S)); } catch (e) {} };
let lvl = 0, qi = 0, hearts = 5, score = 0, res = [], q = null, hover = null, parts = [], popT = 0, raf = 0;

/* ---------- suara ---------- */
let ac;
const beep = (fr, d = .12, t = 'sine', at = 0) => {
  try {
    ac = ac || new AudioContext();
    const o = ac.createOscillator(), g = ac.createGain(), s = ac.currentTime + at;
    o.type = t; o.frequency.value = fr;
    g.gain.setValueAtTime(.12, s); g.gain.exponentialRampToValueAtTime(.001, s + d);
    o.connect(g); g.connect(ac.destination); o.start(s); o.stop(s + d);
  } catch (e) {}
};
const good = () => [523, 659, 784, 1047].forEach((x, i) => beep(x, .16, 'triangle', i * .08));
const bad = () => { beep(200, .25, 'sawtooth'); beep(150, .25, 'sawtooth', .1); };

/* ---------- gambar ---------- */
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function chip(t, x, y, bg, fg = '#fff') {
  ctx.font = '600 14px Inter,sans-serif';
  const w = ctx.measureText(t).width + 18;
  ctx.fillStyle = bg; rr(x - w / 2, y - 12, w, 24, 12); ctx.fill();
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.fillText(t, x, y + 5);
}
function sprite(name, p, o = {}) {
  const im = IMG[name]; if (!im || !im.naturalWidth) return;
  const h = 2.9 * U, w = im.naturalWidth / im.naturalHeight * h, [x, y] = px(p);
  ctx.save(); ctx.globalAlpha = o.a ?? 1; ctx.translate(x, y);
  if (o.fy) ctx.scale(1, -1);
  const k = o.k || 1; ctx.scale(k, k);
  ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
}
function dot(p, c, r = 7) {
  const [x, y] = px(p);
  ctx.fillStyle = c; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
}
function line(a, b, c, w, dash = []) {
  const [x1, y1] = px(a), [x2, y2] = px(b);
  ctx.strokeStyle = c; ctx.lineWidth = w; ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
}
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#fff8ee'; ctx.fillRect(0, 0, W, H);
  ctx.lineWidth = 1; ctx.strokeStyle = '#f1dcc4'; ctx.beginPath();
  for (let i = -NX; i <= NX; i++) { ctx.moveTo(OX + i * U, 0); ctx.lineTo(OX + i * U, H); }
  for (let j = -NY; j <= NY; j++) { ctx.moveTo(0, OY - j * U); ctx.lineTo(W, OY - j * U); }
  ctx.stroke();
  line({ x: -NX, y: 0 }, { x: NX, y: 0 }, '#a9745a', 2);
  line({ x: 0, y: -NY }, { x: 0, y: NY }, '#a9745a', 2);
  ctx.fillStyle = '#a9745a'; ctx.font = '12px Inter,sans-serif';
  ctx.textAlign = 'center';
  for (let i = -NX + 1; i < NX; i++) if (i && i % 2 == 0) ctx.fillText(f(i), OX + i * U, OY + 16);
  ctx.textAlign = 'right';
  for (let j = -NY + 1; j < NY; j++) if (j && j % 2 == 0) ctx.fillText(f(j), OX - 6, OY - j * U + 4);
  ctx.textAlign = 'left'; ctx.fillText('x', W - 14, OY - 8); ctx.fillText('y', OX + 8, 14);

  if (q) {
    const m = q.m;
    // garis cermin
    const E = m.t == 'y' ? [[0, -NY], [0, NY]] : m.t == 'x' ? [[-NX, 0], [NX, 0]] : m.t == 'xk' ? [[m.k, -NY], [m.k, NY]] : m.t == 'yk' ? [[-NX, m.k], [NX, m.k]] : [[-NY, -NY], [NY, NY]];
    line({ x: E[0][0], y: E[0][1] }, { x: E[1][0], y: E[1][1] }, C.red, 4, m.t == 'y' || m.t == 'x' ? [] : [12, 8]);
    const L = m.t == 'y' ? [0, 7.4] : m.t == 'x' ? [8.2, 0] : m.t == 'xk' ? [m.k, 7.4] : m.t == 'yk' ? [7.6, m.k] : [6.3, 6.3];
    chip('cermin: ' + mName(m), ...px({ x: L[0], y: L[1] }), C.red);

    const fp = foot(q.p, m);
    if (q.hint && !q.done) {
      line(q.p, fp, C.orange, 3, [4, 6]); dot(fp, C.orange, 5);
      chip(m.t == 'd' ? 'tegak lurus cermin' : `jarak = ${dist(q.p, fp)}`, ...px(mid(q.p, fp)), C.orange);
    }
    sprite(q.face, q.p, { fy: false }); dot(q.p, C.blue);
    const [ox, oy] = px(q.p); chip(PT(q.name, q.p), ox, oy + 1.75 * U, C.blue);

    if (q.sel && !q.done) {
      sprite(q.aface, q.sel, { a: .5, fy: q.fy }); dot(q.sel, C.yellow);
      const [sx, sy] = px(q.sel); chip(`${q.name}′(${f(q.sel.x)}; ${f(q.sel.y)})`, sx, sy + 1.75 * U, C.orange);
    }
    if (q.done) {
      line(q.p, q.a, C.green, 3, [8, 6]); dot(fp, C.green, 5);
      if (m.t != 'd') {
        const d = dist(q.p, fp);
        chip(`${d}`, ...px(mid(q.p, fp)), C.green); chip(`${d}`, ...px(mid(fp, q.a)), C.green);
      }
      const t = Math.min(1, (performance.now() - popT) / 400);
      sprite(q.aface, q.a, { fy: q.fy, k: t >= 1 ? 1 : .4 + .6 * (1 - (1 - t) ** 3) + .15 * Math.sin(t * Math.PI) });
      dot(q.a, C.red);
      const [ax, ay] = px(q.a); chip(PT(q.name + '′', q.a), ax, ay + 1.75 * U, C.red);
    }
    if (hover && !q.done && !(q.sel && hover.x == q.sel.x && hover.y == q.sel.y)) {
      const [hx, hy] = px(hover);
      ctx.strokeStyle = C.yellow; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, hy, 10, 0, 7); ctx.stroke();
      chip(`(${f(hover.x)}; ${f(hover.y)})`, hx, hy - 24, '#8f1a1a');
    }
  }
  parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .3; p.l--; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 8, 8); });
  parts = parts.filter(p => p.l > 0);
}
function loop() {
  draw();
  raf = (parts.length || (q && q.done && performance.now() - popT < 450)) ? requestAnimationFrame(loop) : 0;
}
const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
function confetti(p) {
  const [x, y] = px(p);
  for (let i = 0; i < 46; i++) parts.push({ x, y, vx: (Math.random() - .5) * 11, vy: -Math.random() * 9 - 2, l: 50 + rnd(0, 20), c: pick([C.red, C.blue, C.green, C.yellow]) });
}

/* ---------- UI ---------- */
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id == id)); }
function say(face, html) { $('#face').src = `assets/${face}.png`; $('#bubble').innerHTML = html; }
function modal(html, btns) {
  const m = $('#modal'), c = $('#mc');
  c.innerHTML = html; const r = document.createElement('div'); r.className = 'row'; c.append(r);
  btns.forEach(([t, fn, cls]) => {
    const b = document.createElement('button'); b.className = 'btn ' + (cls || ''); b.textContent = t;
    b.onclick = () => { m.hidden = true; fn(); }; r.append(b);
  });
  m.hidden = false; r.querySelector('button').focus();
}
function hud() {
  $('#hearts').textContent = '♥'.repeat(hearts) + '♡'.repeat(5 - hearts);
  $('#score').textContent = score + ' poin';
  $('#dots').innerHTML = Array.from({ length: LV[lvl].n }, (_, i) => `<span class="${res[i] || (i == qi ? 'cur' : '')}"></span>`).join('');
  $('#pick').textContent = !q || q.done ? '' : q.sel ? `Pilihanmu: ${q.name}′(${f(q.sel.x)}; ${f(q.sel.y)})` : 'Klik titik di papan untuk menaruh bayangan.';
  $('#check').disabled = !q || q.done || !q.sel;
  $('#hint').disabled = !q || q.done || q.hint;
  $('#next').hidden = !q || !q.done;
}

function renderMap() {
  $('#levels').innerHTML = LV.map((l, i) => {
    const open = i == 0 || S.stars[i - 1] > 0, s = S.stars[i];
    return `<div class="lv ${open ? '' : 'lock'}"><b>${l.name}</b><span>${l.rule}</span><div class="st">${'★'.repeat(s)}${'☆'.repeat(3 - s)}</div>
      <button class="btn small" data-i="${i}" ${open ? '' : 'disabled'}>${open ? 'Main' : 'Terkunci'}</button></div>`;
  }).join('');
  document.querySelectorAll('#levels [data-i]').forEach(b => b.onclick = () => intro(+b.dataset.i));
  show('map');
}
function intro(l) {
  const L = LV[l];
  modal(`<img src="assets/teaching.png" alt=""><h3>${L.name}</h3><div class="formula">${L.rule}</div><p>${L.tip}</p><p><b>Contoh:</b> ${L.ex}</p>`,
    [['Mulai', () => start(l)], ['Kembali', renderMap, 'ghost']]);
}
function start(l) { lvl = l; qi = 0; hearts = 5; score = 0; res = []; $('#lvName').textContent = LV[l].name; show('game'); nextQ(); }
function nextQ() {
  if (qi >= LV[lvl].n) return finish();
  q = gen(lvl); hover = null;
  $('#ask').innerHTML = `Cerminkan titik <b>${PT(q.name, q.p)}</b> terhadap <b>${mName(q.m)}</b>.`;
  say('thinking', 'Di mana bayangannya? Ingat, jarak titik ke cermin sama dengan jarak bayangan ke cermin.');
  hud(); draw();
}
function reveal(ok) {
  q.done = true; popT = performance.now(); res[qi] = ok ? 'ok' : 'bad';
  const exp = `<em>${q.name}′ = ${f(q.a.x)}; ${f(q.a.y)}</em>${explain(q)}`;
  if (ok) { say('wow', pick(['Tepat sekali!', 'Keren, bayangannya pas!', 'Yes! Jaraknya sama persis!', 'Mantap, kamu paham cermin!']) + exp); good(); confetti(q.a); }
  else say('teaching', `Jawabannya ada di titik merah. Rumus: ${ruleOf(q.m)}.` + exp);
  hud(); kick();
  if (hearts <= 0) setTimeout(() => modal('<img src="assets/thinking.png" alt=""><h3>Hati habis</h3><p>Tenang, ulangi level ini dan pakai petunjuk kalau perlu.</p>',
    [['Ulangi level', () => intro(lvl)], ['Pilih level', renderMap, 'ghost']]), 1400);
}
function check() {
  if (!q || q.done || !q.sel) return;
  q.tries++;
  if (q.sel.x == q.a.x && q.sel.y == q.a.y) {
    score += Math.max(0, (q.tries == 1 ? 100 : 50) - (q.hint ? 20 : 0)); reveal(true);
  } else {
    hearts--; bad();
    if (q.tries >= 2 || hearts <= 0) reveal(false);
    else { q.sel = null; say('teaching', `Belum pas. Hitung jarak ${q.name} ke ${mName(q.m)}, lalu pindah sejauh itu ke seberang. Coba lagi!`); hud(); draw(); }
  }
  hud();
}
function hint() {
  if (!q || q.done || q.hint) return;
  q.hint = true; score = Math.max(0, score - 20);
  say('teaching', `Aturan ${mName(q.m)}: <b>${ruleOf(q.m)}</b>. Garis putus-putus oranye menunjukkan jarak ke cermin. Pindah sejauh itu ke seberang.`);
  hud(); draw();
}
function finish() {
  const r = score / (LV[lvl].n * 100), st = r >= .8 ? 3 : r >= .5 ? 2 : 1;
  S.stars[lvl] = Math.max(S.stars[lvl] || 0, st); save(); q = null; draw();
  const last = lvl == LV.length - 1;
  modal(`<img src="assets/cheer.png" alt=""><h3>${last ? 'Kamu jago refleksi!' : 'Level selesai!'}</h3><div class="stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</div><p>Skor: <b>${score}</b> poin</p>`,
    [...(last ? [] : [['Level berikutnya', () => intro(lvl + 1)]]), ['Main lagi', () => intro(lvl), 'ghost'], ['Pilih level', renderMap, 'ghost']]);
}

/* ---------- input ---------- */
const gp = e => {
  const r = cv.getBoundingClientRect(), s = W / r.width;
  return { x: Math.max(-NX, Math.min(NX, Math.round(((e.clientX - r.left) * s - OX) / U))), y: Math.max(-NY, Math.min(NY, Math.round((OY - (e.clientY - r.top) * s) / U))) };
};
cv.onpointermove = e => { if (e.pointerType == 'mouse') { hover = gp(e); draw(); } };
cv.onpointerleave = () => { hover = null; draw(); };
cv.onpointerdown = e => {
  if (!q || q.done) return;
  q.sel = gp(e); if (e.pointerType != 'mouse') hover = null;
  hud(); draw();
};
$('#check').onclick = check;
$('#hint').onclick = hint;
$('#next').onclick = () => { qi++; nextQ(); };
$('#menu').onclick = renderMap;
$('#play').onclick = renderMap;
$('#toStart').onclick = () => show('start');
document.addEventListener('keydown', e => {
  if (e.key != 'Enter' || !$('#modal').hidden || !$('#game').classList.contains('on') || !q) return;
  q.done ? $('#next').click() : check();
});
draw();
})();
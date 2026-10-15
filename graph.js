/* Método gráfico: dibuja restricciones, región factible, vértices y la recta de Z animada (solo 2 variables). */
(function () {
'use strict';
const COL = ['#D43318', '#007AC3', '#5C8727', '#712CF9', '#F58220', '#C2185B'];
const W = 600, H = 420, L = 52, R = 18, TP = 18, BT = 44;

function clip(poly, a, op, b) {
  const val = p => a[0] * p[0] + a[1] * p[1] - b, ins = p => op === '<=' ? val(p) <= 1e-9 : val(p) >= -1e-9, out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length], pi = ins(P), qi = ins(Q);
    if (pi) out.push(P);
    if (pi !== qi) { const dp = val(P), dq = val(Q), t = dp / (dp - dq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return out;
}
const uniq = pts => { const o = []; pts.forEach(p => { if (!o.some(q => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-7)) o.push(p); }); return o; };
const nice = v => { if (v <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e; };

function graph(p, res) {
  const cons = p.cons;
  // intercepts to choose a window
  let mx = 1, my = 1;
  cons.forEach(r => { if (r.a[0] > 1e-9 && r.b / r.a[0] > 0) mx = Math.max(mx, r.b / r.a[0]); if (r.a[1] > 1e-9 && r.b / r.a[1] > 0) my = Math.max(my, r.b / r.a[1]); });
  if (res && res.x && res.x.length) { mx = Math.max(mx, res.x[0] * 1.1); my = Math.max(my, res.x[1] * 1.1); }
  const B = Math.max(mx, my) * 6;
  let poly = [[0, 0], [B, 0], [B, B], [0, B]];
  cons.forEach(r => { if (r.op === '<=' || r.op === '=') poly = clip(poly, r.a, '<=', r.b); if (r.op === '>=' || r.op === '=') poly = clip(poly, r.a, '>=', r.b); });
  poly = uniq(poly);
  const verts = poly.filter(v => v[0] < B - 1e-6 && v[1] < B - 1e-6);
  verts.forEach(v => { mx = Math.max(mx, v[0] * 1.1); my = Math.max(my, v[1] * 1.1); });
  const MX = nice(mx * 1.05), MY = nice(my * 1.05);
  const sx = (W - L - R) / MX, sy = (H - TP - BT) / MY, tx = x => L + x * sx, ty = y => H - BT - y * sy;
  // ordenar polígono por ángulo para dibujarlo bien
  if (poly.length > 2) { const cx = poly.reduce((s, q) => s + q[0], 0) / poly.length, cy = poly.reduce((s, q) => s + q[1], 0) / poly.length; poly.sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx)); }
  const sign = p.type === 'min' ? -1 : 1;
  const rows = verts.map((v, i) => ({ label: String.fromCharCode(65 + i), x: v[0], y: v[1], z: p.c[0] * v[0] + p.c[1] * v[1] }));
  let best = null; rows.forEach(r => { if (!best || sign * r.z > sign * best.z + 1e-9) best = r; });
  const feasible = rows.length > 0;

  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica del método gráfico"><defs><clipPath id="gclip"><rect x="${L}" y="${TP}" width="${W - L - R}" height="${H - TP - BT}"/></clipPath></defs>`;
  const T = 5;
  for (let i = 0; i <= T; i++) {
    const xv = MX * i / T, yv = MY * i / T;
    s += `<line class="g-grid" x1="${tx(xv)}" y1="${TP}" x2="${tx(xv)}" y2="${H - BT}"/><text class="g-tick" x="${tx(xv)}" y="${H - BT + 18}" text-anchor="middle">${+xv.toFixed(2)}</text>`;
    s += `<line class="g-grid" x1="${L}" y1="${ty(yv)}" x2="${W - R}" y2="${ty(yv)}"/><text class="g-tick" x="${L - 8}" y="${ty(yv) + 4}" text-anchor="end">${+yv.toFixed(2)}</text>`;
  }
  s += `<line class="g-axis" x1="${L}" y1="${H - BT}" x2="${W - R}" y2="${H - BT}"/><line class="g-axis" x1="${L}" y1="${TP}" x2="${L}" y2="${H - BT}"/>`;
  s += `<text class="g-lab" x="${W - R}" y="${H - 8}" text-anchor="end">x₁</text><text class="g-lab" x="12" y="${TP + 8}">x₂</text>`;
  s += `<g clip-path="url(#gclip)">`;
  if (feasible && poly.length > 2) s += `<polygon class="g-reg" id="greg" points="${poly.map(q => tx(q[0]) + ',' + ty(q[1])).join(' ')}"/>`;
  cons.forEach((r, i) => {
    const c = COL[i % COL.length]; let x1, y1, x2, y2;
    if (Math.abs(r.a[1]) > 1e-9) { x1 = 0; y1 = r.b / r.a[1]; x2 = MX; y2 = (r.b - r.a[0] * MX) / r.a[1]; }
    else { x1 = x2 = r.b / r.a[0]; y1 = 0; y2 = MY; }
    s += `<line class="g-con" style="stroke:${c};animation-delay:${i * .25}s" x1="${tx(x1)}" y1="${ty(y1)}" x2="${tx(x2)}" y2="${ty(y2)}"/>`;
  });
  s += `<line id="gobj" class="g-obj" x1="0" y1="0" x2="0" y2="0" style="opacity:0"/>`;
  s += `</g>`;
  rows.forEach(r => { const isB = best && r === best && res && (res.status === 'optimal' || res.status === 'multiple'); s += `<circle class="g-pt${isB ? ' g-best' : ''}" cx="${tx(r.x)}" cy="${ty(r.y)}" r="${isB ? 8 : 5}"/><text class="g-ptl" x="${tx(r.x) + 9}" y="${ty(r.y) - 8}">${r.label}</text>`; });
  s += `<text id="gz" class="g-zl" x="${L + 10}" y="${TP + 16}"></text></svg>`;
  const legend = cons.map((r, i) => `<span><i style="background:${COL[i % COL.length]}"></i>R${i + 1}: ${r.a[0]}x₁ + ${r.a[1]}x₂ ${r.op === '<=' ? '≤' : r.op === '>=' ? '≥' : '='} ${r.b}</span>`).join('');

  function play(root) {
    const line = root.querySelector('#gobj'), lab = root.querySelector('#gz');
    if (!line || !feasible || !best) return;
    const zs = rows.reduce((a, r) => sign * r.z < sign * a ? r.z : a, best.z), ze = best.z;
    const draw = z => {
      let x1, y1, x2, y2; const c1 = p.c[0], c2 = p.c[1];
      if (Math.abs(c2) > 1e-9) { x1 = 0; y1 = z / c2; x2 = MX; y2 = (z - c1 * MX) / c2; } else if (Math.abs(c1) > 1e-9) { x1 = x2 = z / c1; y1 = 0; y2 = MY; } else return;
      line.setAttribute('x1', tx(x1)); line.setAttribute('y1', ty(y1)); line.setAttribute('x2', tx(x2)); line.setAttribute('y2', ty(y2)); line.style.opacity = 1;
      lab.textContent = 'Z = ' + (+z.toFixed(2));
    };
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { draw(ze); return; }
    const t0 = performance.now(), D = 2600; let raf;
    const tick = t => { const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3); draw(zs + (ze - zs) * e); if (k < 1) raf = requestAnimationFrame(tick); };
    cancelAnimationFrame(play.raf); play.raf = requestAnimationFrame(tick);
  }
  return { svg: s, rows, best, legend, play, feasible };
}
window.IO.graph = graph;
})();

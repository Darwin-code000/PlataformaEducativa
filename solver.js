/* Motor de Investigación de Operaciones: Simplex, Método de la M, Dos Fases, casos especiales y heurística.
   Los coeficientes de la fila Z se guardan como pares [k, m] que significan  k + m·M  (para el Método de la M). */
(function (root) {
'use strict';
const EPS = 1e-9, Z0 = [0, 0];
const padd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const psub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const pk = (a, s) => [a[0] * s, a[1] * s];
const iz = a => Math.abs(a[0]) < EPS && Math.abs(a[1]) < EPS;
const pcmp = (a, b) => { const dm = a[1] - b[1]; if (Math.abs(dm) > EPS) return dm < 0 ? -1 : 1; const dk = a[0] - b[0]; return Math.abs(dk) > EPS ? (dk < 0 ? -1 : 1) : 0; };

function fr(v) {
  if (Math.abs(v) < 1e-9) return '0';
  const s = v < 0 ? '−' : ''; v = Math.abs(v);
  if (Math.abs(v - Math.round(v)) < 1e-9) return s + Math.round(v);
  for (let d = 2; d <= 60; d++) { const n = Math.round(v * d); if (Math.abs(v - n / d) < 1e-9) return s + n + '/' + d; }
  return s + (+v.toFixed(3));
}
function fp(p) {
  const k = p[0], m = p[1];
  if (Math.abs(m) < 1e-9) return fr(k);
  let t = (m < 0 ? '−' : '') + (Math.abs(Math.abs(m) - 1) < 1e-9 ? '' : fr(Math.abs(m))) + 'M';
  if (Math.abs(k) > 1e-9) t += (k < 0 ? ' − ' : ' + ') + fr(Math.abs(k));
  return t;
}
const flip = op => op === '<=' ? '>=' : op === '>=' ? '<=' : '=';
const needsArt = r => (r.b < 0 ? flip(r.op) : r.op) !== '<=';

function build(p) {
  const n = p.c.length, sign = p.type === 'min' ? -1 : 1;
  const cons = p.cons.map(r => r.b < 0 ? { a: r.a.map(v => -v), op: flip(r.op), b: -r.b } : { a: r.a.slice(), op: r.op, b: r.b });
  const cols = []; for (let j = 0; j < n; j++) cols.push({ name: 'x' + (j + 1), t: 'x', j });
  const extra = [];
  cons.forEach((r, i) => {
    if (r.op === '<=') extra.push({ i, coef: 1, name: 's' + (i + 1), t: 's', basic: true });
    else if (r.op === '>=') { extra.push({ i, coef: -1, name: 's' + (i + 1), t: 's' }); extra.push({ i, coef: 1, name: 'a' + (i + 1), t: 'a', basic: true }); }
    else extra.push({ i, coef: 1, name: 'a' + (i + 1), t: 'a', basic: true });
  });
  extra.forEach(e => cols.push({ name: e.name, t: e.t }));
  const A = cons.map(r => { const row = r.a.slice(); while (row.length < cols.length) row.push(0); return row; });
  const basis = new Array(cons.length);
  extra.forEach((e, k) => { A[e.i][n + k] = e.coef; if (e.basic) basis[e.i] = n + k; });
  return { cols, A, b: cons.map(r => r.b), basis, n, sign, c0: p.c };
}
function cvec(T, phase, method) {
  return T.cols.map(c => c.t === 'x' ? (phase === 1 ? [0, 0] : [T.sign * T.c0[c.j], 0]) : c.t === 's' ? [0, 0] : (phase === 1 ? [-1, 0] : (method === 'bigM' ? [0, -1] : [0, 0])));
}
function row0(T, c) {
  const r0 = T.cols.map((_, j) => { let z = [0, 0]; T.basis.forEach((bj, i) => { z = padd(z, pk(c[bj], T.A[i][j])); }); return psub(z, c[j]); });
  let zv = [0, 0]; T.basis.forEach((bj, i) => { zv = padd(zv, pk(c[bj], T.b[i])); });
  return { r0, zv };
}
function pivot(T, l, e) {
  const pv = T.A[l][e];
  T.A[l] = T.A[l].map(v => v / pv); T.b[l] /= pv;
  T.A.forEach((row, i) => {
    if (i === l) return; const f = row[e]; if (Math.abs(f) < EPS) return;
    T.A[i] = row.map((v, j) => v - f * T.A[l][j]); T.b[i] -= f * T.b[l];
  });
  T.basis[l] = e;
  T.A.forEach(r => r.forEach((v, j) => { if (Math.abs(v) < 1e-12) r[j] = 0; }));
  T.b = T.b.map(v => Math.abs(v) < 1e-12 ? 0 : v);
}
function snap(T, c, label, zl) {
  const { r0, zv } = row0(T, c);
  return { phase: label, zl, cols: T.cols.map(x => x.name), A: T.A.map(r => r.slice()), b: T.b.slice(), basis: T.basis.map(j => T.cols[j].name), r0, zv, enter: -1, leave: -1, ratios: null, msg: '', kind: 'iter' };
}
function run(T, c, steps, ctx, label, zl) {
  for (let it = 0; it < 80; it++) {
    const s = snap(T, c, label, zl); steps.push(s);
    if (T.b.some(v => Math.abs(v) < EPS)) ctx.degenerate = true;
    let e = -1;
    s.r0.forEach((v, j) => { if (pcmp(v, Z0) < 0 && (e < 0 || pcmp(v, s.r0[e]) < 0)) e = j; });
    if (e < 0) { s.kind = 'opt'; s.msg = 'Ningún valor de la fila Z es negativo: ¡llegamos al óptimo!'; return { status: 'optimal', r0: s.r0 }; }
    const ratios = T.A.map((row, i) => row[e] > EPS ? T.b[i] / row[e] : null);
    let l = -1, best = Infinity, ties = 0;
    ratios.forEach((r, i) => {
      if (r === null) return;
      if (r < best - EPS) { best = r; l = i; ties = 1; }
      else if (Math.abs(r - best) <= EPS) { ties++; if (T.basis[i] < T.basis[l]) l = i; }
    });
    s.enter = e; s.ratios = ratios;
    if (l < 0) { s.kind = 'unb'; s.msg = `${T.cols[e].name} puede crecer sin límite porque ninguna fila lo frena (no hay valores positivos en su columna). ¡Solución no acotada!`; return { status: 'unbounded' }; }
    if (ties > 1) ctx.degenerate = true;
    s.leave = l;
    s.msg = `Entra ${T.cols[e].name} (el más negativo de la fila Z: ${fp(s.r0[e])}). Sale ${T.cols[T.basis[l]].name} (razón mínima ${fr(best)}). El pivote es ${fr(T.A[l][e])}.` + (ties > 1 ? ' ¡Hay empate en la razón mínima! Eso produce degeneración: la próxima variable básica valdrá 0.' : '');
    pivot(T, l, e);
  }
  return { status: 'cycling' };
}
const xOf = T => { const x = new Array(T.n).fill(0); T.basis.forEach((bj, i) => { const c = T.cols[bj]; if (c.t === 'x') x[c.j] = T.b[i]; }); return x; };
const evalZ = (p, x) => p.c.reduce((s, v, j) => s + v * x[j], 0);

function solve(p, method) {
  method = method || 'auto';
  const hasArt = p.cons.some(needsArt);
  if (method === 'auto') method = hasArt ? 'twophase' : 'simplex';
  const res = { status: '', x: [], z: null, steps: [], method, degenerate: false, alt: null, notes: [], msg: '' };
  if (method === 'simplex' && hasArt) { res.status = 'needsArt'; return res; }
  const T = build(p), ctx = { degenerate: false }, zl = p.type === 'min' ? '−Z' : 'Z';
  let st, c;
  if (method === 'twophase' && hasArt) {
    const c1 = cvec(T, 1, method);
    st = run(T, c1, res.steps, ctx, 'Fase 1 (eliminar variables artificiales)', 'W');
    const w = row0(T, c1).zv[0];
    if (st.status !== 'optimal' || w < -1e-7) { res.status = 'infeasible'; res.msg = 'Al terminar la Fase 1 las variables artificiales no llegaron a 0 (W ≠ 0): las restricciones se contradicen.'; return res; }
    for (let i = T.A.length - 1; i >= 0; i--) {
      if (T.cols[T.basis[i]].t !== 'a') continue;
      const j = T.cols.findIndex((cc, jj) => cc.t !== 'a' && Math.abs(T.A[i][jj]) > 1e-7);
      if (j >= 0) { pivot(T, i, j); res.notes.push('Una variable artificial seguía en la base con valor 0 y se sacó con un pivote extra.'); }
      else { T.A.splice(i, 1); T.b.splice(i, 1); T.basis.splice(i, 1); res.notes.push('Se eliminó una restricción redundante.'); }
    }
    const keep = T.cols.map((cc, j) => cc.t !== 'a' ? j : -1).filter(j => j >= 0), map = {}; keep.forEach((j, k) => { map[j] = k; });
    T.A = T.A.map(r => keep.map(j => r[j])); T.cols = keep.map(j => T.cols[j]); T.basis = T.basis.map(j => map[j]);
    c = cvec(T, 2, method);
    st = run(T, c, res.steps, ctx, 'Fase 2 (problema original)', zl);
  } else {
    c = cvec(T, 2, method);
    st = run(T, c, res.steps, ctx, method === 'bigM' ? 'Método de la M' : 'Simplex', zl);
  }
  if (st.status === 'unbounded') { res.status = 'unbounded'; res.msg = 'Z crece sin límite: falta una restricción que lo frene.'; return res; }
  if (st.status !== 'optimal') { res.status = st.status; res.msg = 'El método dio demasiadas vueltas (posible ciclo).'; return res; }
  const artBad = T.basis.some((bj, i) => T.cols[bj].t === 'a' && T.b[i] > 1e-7);
  if (artBad) { res.status = 'infeasible'; res.msg = 'Quedó una variable artificial con valor positivo en la solución final: las restricciones se contradicen.'; return res; }
  res.x = xOf(T); res.z = evalZ(p, res.x);
  res.degenerate = ctx.degenerate || T.b.some(v => Math.abs(v) < EPS);
  res.status = 'optimal';
  // ¿óptimos alternativos? variable no básica con 0 en la fila Z
  const r0 = row0(T, c).r0, isB = new Set(T.basis);
  const j = T.cols.findIndex((cc, k) => cc.t !== 'a' && !isB.has(k) && iz(r0[k]));
  if (j >= 0) {
    const T2 = JSON.parse(JSON.stringify(T)); let l = -1, best = Infinity;
    T2.A.forEach((row, i) => { if (row[j] > EPS) { const r = T2.b[i] / row[j]; if (r < best - EPS) { best = r; l = i; } } });
    if (l < 0) res.alt = { ray: true, name: T.cols[j].name };
    else {
      pivot(T2, l, j); const x2 = xOf(T2);
      if (x2.some((v, k) => Math.abs(v - res.x[k]) > 1e-7)) {
        const s2 = snap(T2, c, 'Otra solución óptima', zl); s2.kind = 'alt';
        s2.msg = `${T.cols[j].name} tiene 0 en la fila Z, así que puede entrar sin cambiar Z. Este es un segundo vértice óptimo.`;
        res.steps.push(s2); res.alt = { x2, name: T.cols[j].name };
      }
    }
    if (res.alt) res.status = 'multiple';
  }
  return res;
}

function heuristic(p) {
  const n = p.c.length;
  if (p.type !== 'max' || p.cons.some(r => r.op !== '<=' || r.b < 0 || r.a.some(v => v < 0)) || p.c.some(v => v < 0))
    return { ok: false, msg: 'Esta heurística voraz funciona con problemas de maximizar con restricciones ≤ y números no negativos.' };
  const eff = p.c.map((cj, j) => { const use = p.cons.reduce((s, r) => s + (r.b > 0 ? r.a[j] / r.b : 0), 0); return use > 0 ? cj / use : (cj > 0 ? Infinity : 0); });
  if (eff.some(v => v === Infinity)) return { ok: false, msg: 'Una variable no consume ningún recurso y gana dinero: el problema no tiene límite.' };
  const order = eff.map((e, j) => j).sort((a, b) => eff[b] - eff[a]);
  const rem = p.cons.map(r => r.b), x = new Array(n).fill(0), steps = [];
  order.forEach(j => {
    let u = Infinity; p.cons.forEach((r, i) => { if (r.a[j] > EPS) u = Math.min(u, rem[i] / r.a[j]); });
    if (!isFinite(u)) u = 0; if (p.c[j] <= 0) u = 0;
    x[j] = u; p.cons.forEach((r, i) => { rem[i] -= r.a[j] * u; });
    steps.push({ j, eff: eff[j], units: u, rem: rem.map(v => Math.abs(v) < 1e-9 ? 0 : v) });
  });
  return { ok: true, x, z: evalZ(p, x), steps, order };
}

root.IO = { solve, heuristic, fr, fp, evalZ };
if (typeof module !== 'undefined') module.exports = root.IO;
})(typeof window !== 'undefined' ? window : globalThis);

(function () {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const IO = window.IO, TOP = window.TOPICS, HIS = window.HISTORY;
const COLORS = ['#007AC3', '#FF0084', '#5C8727', '#9E1B0E', '#D43318', '#FFC107', '#712CF9', '#F58220', '#00A99D', '#3F7EF6', '#C2185B', '#6C757D'];
const NAV = { historia: 'Historia de la IO', intro: 'Introducción a la PL', grafico: 'Método gráfico', heuristica: 'Heurística', 'simplex-max': 'Simplex: maximizar', 'simplex-min': 'Simplex: minimizar', 'dos-fases': 'Dos fases', m: 'Método de la M', degeneracion: 'Degeneración', alternativos: 'Óptimos alternativos', 'no-acotada': 'Solución no acotada', 'no-factible': 'Solución no factible' };
const METH = { simplex: 'Simplex', bigM: 'Método de la M', twophase: 'Dos fases' };
const OPS = { '<=': '≤', '>=': '≥', '=': '=' };
const sub = c => c.replace(/([a-z])(\d+)/, '$1<sub>$2</sub>');
const negp = p => [p[0] === 0 ? 0 : -p[0], p[1] === 0 ? 0 : -p[1]];
const store = {
  get() { try { return JSON.parse(localStorage.getItem('ioDone') || '[]'); } catch (e) { return []; } },
  add(id) { const a = this.get(); if (!a.includes(id)) { a.push(id); try { localStorage.setItem('ioDone', JSON.stringify(a)); } catch (e) {} } }
};
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 3200); }

/* ---------- menú y progreso ---------- */
function buildNav() {
  const done = store.get();
  let h = '<a href="#/home" data-r="home"><span class="ic" style="background:#007AC3"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"><path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg></span>Inicio</a>';
  TOP.forEach((t, i) => { h += `<a href="#/t/${t.id}" data-r="t/${t.id}"><span class="ic${done.includes(t.id) ? ' done' : ''}" style="background:${COLORS[i]};${COLORS[i] === '#FFC107' ? 'color:#072C50' : ''}">${i + 1}</span>${NAV[t.id]}</a>`; });
  h += '<a href="#/solver" data-r="solver"><span class="ic" style="background:#712CF9">Σ</span>Resolvedor</a>';
  $('#nav').innerHTML = h;
  $('#pTxt').textContent = done.length + '/' + TOP.length; $('#pBar').style.width = done.length / TOP.length * 100 + '%';
}

/* ---------- piezas reutilizables ---------- */
function tableHTML(s, conv) {
  const cz = conv === 'cz', rc = s.ratios !== null, zz = v => IO.fp(cz ? negp(v) : v);
  let h = `<div class="tw"><table class="tab"><thead><tr><th>Base</th>${s.cols.map((c, j) => `<th class="${j === s.enter ? 'ce' : ''}">${sub(c)}</th>`).join('')}<th>LD</th>${rc ? '<th>Razón</th>' : ''}</tr></thead><tbody>`;
  h += `<tr class="rz"><td>${cz ? 'C<sub>j</sub>−Z<sub>j</sub>' : s.zl}</td>${s.r0.map((v, j) => `<td class="${j === s.enter ? 'ce' : ''}">${zz(v)}</td>`).join('')}<td>${IO.fp(s.zv)}</td>${rc ? '<td></td>' : ''}</tr>`;
  s.A.forEach((row, i) => { h += `<tr class="${i === s.leave ? 'rl' : ''}"><td>${sub(s.basis[i])}</td>${row.map((v, j) => `<td class="${j === s.enter ? 'ce' : ''}${i === s.leave && j === s.enter ? ' pv' : ''}">${IO.fr(v)}</td>`).join('')}<td>${IO.fr(s.b[i])}</td>${rc ? `<td class="rt">${s.ratios[i] === null ? '—' : IO.fr(s.ratios[i])}</td>` : ''}</tr>`; });
  return h + `</tbody></table></div><p class="cap">Valor actual: ${s.zl} = ${IO.fp(s.zv)}</p>`;
}
function stepMsg(s, conv) {
  const cz = conv === 'cz', i = s.info;
  if (s.kind === 'opt') return cz ? 'Ningún valor de Cⱼ − Zⱼ es positivo: ¡llegamos al óptimo!' : 'Ningún valor de Zⱼ − Cⱼ es negativo: ¡llegamos al óptimo!';
  if (s.kind === 'iter' && i) {
    const why = i.bland ? (cz ? 'la primera con Cⱼ − Zⱼ positivo, regla de Bland para evitar ciclos' : 'la primera con Zⱼ − Cⱼ negativo, regla de Bland para evitar ciclos') : (cz ? 'el más positivo de Cⱼ − Zⱼ' : 'el más negativo de Zⱼ − Cⱼ');
    return `Entra ${sub(i.eName)} (${why}: ${IO.fp(cz ? negp(i.ev) : i.ev)}). Sale ${sub(i.lName)} (razón mínima ${IO.fr(i.best)}). El pivote es ${IO.fr(i.pv)}.` + (i.ties > 1 ? ' ¡Empate en la razón mínima! Eso produce degeneración: la próxima variable básica valdrá 0.' : '');
  }
  return s.msg;
}
function banner(p, r) {
  const fx = a => a.map((v, j) => `x<sub>${j + 1}</sub> = ${IO.fr(v)}`).join(', ');
  const vals = x => '<div class="vals">' + x.map((v, j) => `<div class="val"><span>x<sub>${j + 1}</sub></span><b>${IO.fr(v)}</b></div>`).join('') + `<div class="val"><span>Z</span><b>${IO.fr(r.z)}</b></div></div>`;
  let h = '', tags = '';
  if (r.status === 'optimal') h = `<b>¡Solución óptima encontrada!</b><br>Para ${p.type === 'max' ? 'ganar lo máximo' : 'gastar lo mínimo'}: ${fx(r.x)}, con Z = ${IO.fr(r.z)}.` + vals(r.x);
  else if (r.status === 'multiple') h = `<b>¡Hay infinitas soluciones óptimas!</b><br>Dos esquinas dan el mismo Z = ${IO.fr(r.z)}: (${r.x.map(IO.fr).join(', ')})` + (r.alt.x2 ? ` y (${r.alt.x2.map(IO.fr).join(', ')}). Cualquier punto del segmento entre ellas también es óptimo: λ·V₁ + (1−λ)·V₂ con 0 ≤ λ ≤ 1.` : '. Además la solución se extiende en una semirrecta sin fin.') + vals(r.x);
  else if (r.status === 'unbounded') h = `<b>Solución no acotada.</b><br>${r.msg} Revisa si falta una restricción en tu modelo.`;
  else if (r.status === 'infeasible') h = `<b>Solución no factible.</b><br>${r.msg}`;
  else if (r.status === 'needsArt') h = '<b>El Simplex normal no alcanza.</b><br>Este problema tiene restricciones ≥ o =, que necesitan variables artificiales. <div class="lb" style="margin-top:12px"><button class="btn red" data-act="m:twophase">Usar dos fases</button><button class="btn out" data-act="m:bigM">Usar el Método de la M</button></div>';
  else h = `<b>No se pudo terminar.</b><br>${r.msg}`;
  if (r.method && r.status !== 'needsArt') tags += `<span class="tag">${METH[r.method]}</span>`;
  if (r.degenerate && (r.status === 'optimal' || r.status === 'multiple')) tags += '<span class="tag">Degenerada</span>';
  if (r.status === 'multiple') tags += '<span class="tag">Óptimos alternativos</span>';
  if ((r.status === 'optimal' || r.status === 'multiple') && IO.check(p, r.x).ok) tags += '<span class="tag">Comprobado ✓</span>';
  r.notes.forEach(n => { tags += `<span class="tag">${n}</span>`; });
  return `<div class="ban s-${r.status}">${h}<div class="tags">${tags}</div></div>`;
}
function checkHTML(p, res) {
  if (res.status !== 'optimal' && res.status !== 'multiple') return '';
  const sols = [res.x].concat(res.alt && res.alt.x2 ? [res.alt.x2] : []);
  return sols.map((x, k) => { const c = IO.check(p, x); return `<h3 class="sh">${sols.length > 1 ? 'Vértice ' + (k + 1) + ': ' : 'Solución: '}(${x.map(IO.fr).join(', ')})</h3><div class="tw"><table class="tab"><thead><tr><th>Restricción</th><th>Lado izquierdo</th><th>Condición</th><th>¿Cumple?</th></tr></thead><tbody>${c.rows.map(r => `<tr><td>R${r.i + 1}</td><td>${IO.fr(r.lhs)}</td><td>${OPS[r.op]} ${IO.fr(r.b)}</td><td class="${r.ok ? 'yes' : 'no2'}">${r.ok ? 'Sí ✓' : 'No ✗'}</td></tr>`).join('')}</tbody></table></div><p class="cap">Z = ${IO.fr(c.z)}. ${c.ok ? 'Cumple todas las restricciones y x ≥ 0.' : '¡Algo no se cumple!'}</p>`; }).join('');
}
const vtable = (g, res, p) => '<div class="tw"><table class="tab"><thead><tr><th>Vértice</th><th>x<sub>1</sub></th><th>x<sub>2</sub></th><th>Z</th></tr></thead><tbody>' + g.rows.map(r => `<tr class="${g.best === r && (res.status === 'optimal' || res.status === 'multiple') ? 'rl' : ''}"><td>${r.label}</td><td>${IO.fr(r.x)}</td><td>${IO.fr(r.y)}</td><td>${IO.fr(r.z)}</td></tr>`).join('') + '</tbody></table></div>';
function heurHTML(hr, res) {
  if (!hr.ok) return `<div class="msg">${hr.msg}</div>`;
  let h = '<p class="mut" style="margin-bottom:10px">Se asigna primero la variable más eficiente (ganancia ÷ suma de lo que consume de cada recurso, como fracción de lo disponible).</p><div class="tw"><table class="tab"><thead><tr><th>Orden</th><th>Variable</th><th>Eficiencia</th><th>Unidades</th><th>Recursos que sobran</th></tr></thead><tbody>';
  hr.steps.forEach((s, i) => { h += `<tr style="animation:in .5s ${i * .25}s both"><td>${i + 1}</td><td>x<sub>${s.j + 1}</sub></td><td>${(+s.eff.toFixed(3))}</td><td>${IO.fr(s.units)}</td><td>${s.rem.map(IO.fr).join(' ; ')}</td></tr>`; });
  const ex = res.status === 'optimal' || res.status === 'multiple' ? res.z : null;
  h += '</tbody></table></div><div class="cmp"><div><span>Z de la heurística</span><b>' + IO.fr(hr.z) + '</b></div>' + (ex !== null ? `<div><span>Z óptimo (Simplex)</span><b>${IO.fr(ex)}</b></div><div><span>Brecha</span><b>${ex ? (+((ex - hr.z) / ex * 100).toFixed(1)) : 0}%</b></div>` : '') + '</div>';
  return h + `<div class="msg">${ex !== null && Math.abs(ex - hr.z) < 1e-9 ? 'Esta vez la heurística encontró el óptimo.' : 'La heurística es rápida pero puede quedarse por debajo del óptimo exacto. Eso es normal.'}</div>`;
}

/* ---------- resolvedor (un solo componente que se mueve entre páginas) ---------- */
const S = { n: 2, m: 3, type: 'max', c: [3, 5], rows: [{ a: [1, 0], op: '<=', b: 4 }, { a: [0, 2], op: '<=', b: 12 }, { a: [3, 2], op: '<=', b: 18 }], si: 0, res: null, p: null, heur: null, tab: 'steps', timer: null, ex: [], conv: 'zc', all: [] };
const SV = document.createElement('section'); SV.className = 'card'; SV.id = 'solver';
SV.innerHTML = `<h2>Resolvedor de problemas</h2><p class="mut">Escribe tu problema, elige un método y mira cómo se resuelve paso a paso. Llena todas las casillas (usa 0 si una variable no aparece).</p>
<div class="sset">
<div class="fld"><span>Objetivo</span><select id="stype"><option value="max">Maximizar Z</option><option value="min">Minimizar Z</option></select></div>
<div class="fld"><span>Variables</span><div class="stp"><button id="vM" aria-label="Menos variables">−</button><b id="vN">2</b><button id="vP" aria-label="Más variables">+</button></div></div>
<div class="fld"><span>Restricciones</span><div class="stp"><button id="rM" aria-label="Menos restricciones">−</button><b id="rN">3</b><button id="rP" aria-label="Más restricciones">+</button></div></div>
<div class="fld"><span>Método</span><select id="smeth"><option value="auto">Automático</option><option value="simplex">Simplex</option><option value="bigM">Método de la M</option><option value="twophase">Dos fases</option><option value="graph">Gráfico (2 variables)</option><option value="heur">Heurística</option></select></div>
<div class="fld"><span>Fila Z de la tabla</span><select id="sconv"><option value="zc">Zⱼ − Cⱼ (más negativo)</option><option value="cz">Cⱼ − Zⱼ (más positivo)</option></select></div>
</div>
<div id="sform"></div>
<div class="srow"><button class="btn red" id="sRun">Resolver</button><button class="btn out" id="sClr">Limpiar</button><select id="sEx" aria-label="Cargar ejemplo"></select></div>
<div id="sres" hidden></div>`;

function normalize() {
  while (S.rows.length < S.m) S.rows.push({ a: [], op: '<=', b: 0 });
  S.rows.forEach(r => { while (r.a.length < S.n) r.a.push(0); });
  while (S.c.length < S.n) S.c.push(0);
}
function read() {
  S.type = $('#stype', SV).value; const bad = [];
  const rd = i => { const v = parseFloat(i.value); if (i.value.trim() === '' || !isFinite(v)) { i.classList.add('bad'); i.setAttribute('aria-invalid', 'true'); bad.push(i); return 0; } return v; };
  $$('[data-c]', SV).forEach(i => { S.c[+i.dataset.c] = rd(i); });
  $$('[data-r]', SV).forEach(i => { S.rows[+i.dataset.r].a[+i.dataset.j] = rd(i); });
  $$('[data-op]', SV).forEach(s => { S.rows[+s.dataset.op].op = s.value; });
  $$('[data-b]', SV).forEach(i => { S.rows[+i.dataset.b].b = rd(i); });
  return bad;
}
function form() {
  normalize();
  const inp = (attrs, v, lab) => `<input type="number" step="any" inputmode="decimal" ${attrs} aria-label="${lab}" value="${v}">`;
  let h = '<div class="obj"><b>Z =</b>' + Array.from({ length: S.n }, (_, j) => `<span class="term">${inp(`data-c="${j}"`, S.c[j], 'Coeficiente de x' + (j + 1) + ' en Z')}<i>x<sub>${j + 1}</sub>${j < S.n - 1 ? ' +' : ''}</i></span>`).join('') + '</div>';
  for (let i = 0; i < S.m; i++) {
    const r = S.rows[i];
    h += `<div class="crow"><em>R${i + 1}</em>` + Array.from({ length: S.n }, (_, j) => `<span class="term">${inp(`data-r="${i}" data-j="${j}"`, r.a[j], 'Coeficiente de x' + (j + 1) + ' en la restricción ' + (i + 1))}<i>x<sub>${j + 1}</sub>${j < S.n - 1 ? ' +' : ''}</i></span>`).join('')
      + `<select data-op="${i}" aria-label="Tipo de restricción ${i + 1}">${['<=', '>=', '='].map(o => `<option value="${o}"${r.op === o ? ' selected' : ''}>${OPS[o]}</option>`).join('')}</select>${inp(`data-b="${i}"`, r.b, 'Lado derecho de la restricción ' + (i + 1))}</div>`;
  }
  $('#sform', SV).innerHTML = h + '<p class="hint">Todas las variables cumplen x ≥ 0.</p>';
  $('#vN', SV).textContent = S.n; $('#rN', SV).textContent = S.m; $('#stype', SV).value = S.type;
}
const problem = () => ({ type: S.type, c: S.c.slice(0, S.n), cons: S.rows.slice(0, S.m).map(r => ({ a: r.a.slice(0, S.n), op: r.op, b: r.b })) });
function load(p, m, go) {
  S.n = p.c.length; S.m = p.cons.length; S.type = p.type; S.c = p.c.slice(); S.rows = p.cons.map(r => ({ a: r.a.slice(), op: r.op, b: r.b }));
  $('#smeth', SV).value = m || 'auto'; form();
  if (go) { run(); $('#sres', SV).scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}
function setExamples(list) {
  S.ex = list; const s = $('#sEx', SV);
  s.innerHTML = '<option value="">Cargar otro ejemplo…</option>' + list.map((e, i) => `<option value="${i}">${e.name}</option>`).join('');
  s.hidden = list.length < 2;
}
function fillSelect() {
  const all = []; TOP.forEach(t => (t.examples || []).forEach(e => all.push(Object.assign({}, e, { name: NAV[t.id] + ': ' + e.name }))));
  S.all = all;
}
function run() {
  const bad = read();
  if (bad.length) { toast('Faltan datos: escribe un número en cada casilla marcada en rojo (usa 0 si no aplica).'); bad[0].focus(); $('#sres', SV).hidden = true; return; }
  const p = problem(), m = $('#smeth', SV).value;
  if (p.c.every(v => v === 0)) { toast('Escribe al menos un coeficiente distinto de 0 en Z.'); return; }
  if (m === 'graph' && p.c.length !== 2) toast('El método gráfico necesita exactamente 2 variables.');
  S.p = p; S.res = IO.solve(p, (m === 'graph' || m === 'heur') ? 'auto' : m); S.heur = IO.heuristic(p); S.si = 0; stop();
  S.tab = m === 'graph' && p.c.length === 2 ? 'graph' : m === 'heur' ? 'heur' : 'steps';
  show();
}
function show() {
  const r = S.res, hasSteps = r.steps.length > 0, two = S.p.c.length === 2, okSol = r.status === 'optimal' || r.status === 'multiple';
  const tabs = [['model', 'Modelo', true], ['steps', 'Paso a paso', hasSteps], ['graph', 'Gráfica', two], ['heur', 'Heurística', S.heur.ok || $('#smeth', SV).value === 'heur'], ['check', 'Comprobación', okSol]].filter(t => t[2]);
  if (!tabs.some(t => t[0] === S.tab)) S.tab = tabs[0][0];
  const el = $('#sres', SV); el.hidden = false;
  el.innerHTML = banner(S.p, r) + '<div class="tabs2" role="tablist">' + tabs.map(t => `<button role="tab" data-tab="${t[0]}" class="${S.tab === t[0] ? 'on' : ''}">${t[1]}</button>`).join('') + '</div><div class="pane2" id="pane"></div>';
  pane();
}
function pane() {
  const el = $('#pane', SV); stop();
  if (S.tab === 'model') { const d = IO.describe(S.p, S.res.method); el.innerHTML = `<h3 class="sh">Tu modelo</h3><div class="mdl">${d.model.join('<br>')}</div><h3 class="sh">Forma estándar (lo que usa el método)</h3><div class="mdl">${d.std.join('<br>')}</div>`; }
  else if (S.tab === 'steps') { el.innerHTML = '<div class="ctl"><button class="btn out" data-act="prev">Anterior</button><button class="btn red" data-act="next">Siguiente</button><button class="btn out" data-act="play">Reproducir</button><span class="cnt" id="cnt"></span></div><div id="stp"></div>'; step(); }
  else if (S.tab === 'graph') graphPane(el);
  else if (S.tab === 'check') el.innerHTML = checkHTML(S.p, S.res);
  else el.innerHTML = heurHTML(S.heur, S.res);
}
function step() {
  const s = S.res.steps[S.si], n = S.res.steps.length;
  $('#cnt', SV).textContent = `Paso ${S.si + 1} de ${n}`;
  $('#stp', SV).innerHTML = `<span class="ph">${s.phase}</span><div style="margin-top:12px">${tableHTML(s, S.conv)}</div><div class="msg">${stepMsg(s, S.conv)}</div>`;
}
function stop() { clearInterval(S.timer); S.timer = null; const b = $('[data-act="play"]', SV); if (b) b.textContent = 'Reproducir'; }
function play() {
  if (S.timer) { stop(); return; }
  $('[data-act="play"]', SV).textContent = 'Pausar'; if (S.si >= S.res.steps.length - 1) { S.si = 0; step(); }
  S.timer = setInterval(() => { if (S.si < S.res.steps.length - 1) { S.si++; step(); } else stop(); }, 1700);
}
function graphPane(el) {
  const g = IO.graph(S.p, S.res); let h = `<div class="leg">${g.legend}</div><div class="gwrap">${g.svg}</div>`;
  if (!g.feasible) h += '<div class="msg">No hay región factible: las zonas permitidas de las restricciones no se cruzan. Por eso el problema es no factible.</div>';
  else h += (S.res.status === 'unbounded' ? '<div class="msg">La región factible se abre hacia el infinito en la dirección donde Z mejora: por eso es no acotado.</div>' : '') + '<div style="margin-top:12px">' + vtable(g, S.res, S.p) + '</div>';
  h += '<div class="ctl" style="margin-top:12px"><button class="btn out" data-act="replay">Repetir animación</button></div>';
  el.innerHTML = h; S.g = g; setTimeout(() => g.play(el), 900);
}
SV.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'sRun') return run();
  if (b.id === 'sClr') { S.c = Array(S.n).fill(0); S.rows.forEach(r => { r.a = Array(S.n).fill(0); r.b = 0; }); form(); $('#sres', SV).hidden = true; return; }
  const dn = { vM: ['n', -1, 2, 5], vP: ['n', 1, 2, 5], rM: ['m', -1, 1, 6], rP: ['m', 1, 1, 6] }[b.id];
  if (dn) { read(); S[dn[0]] = Math.min(dn[3], Math.max(dn[2], S[dn[0]] + dn[1])); return form(); }
  if (b.dataset.tab) { S.tab = b.dataset.tab; $$('[data-tab]', SV).forEach(t => t.classList.toggle('on', t === b)); return pane(); }
  const a = b.dataset.act; if (!a) return;
  if (a === 'prev') { if (S.si > 0) { S.si--; step(); } }
  else if (a === 'next') { if (S.si < S.res.steps.length - 1) { S.si++; step(); } else toast('Ya estás en el último paso'); }
  else if (a === 'play') play();
  else if (a === 'replay') S.g && S.g.play($('#pane', SV));
  else if (a.startsWith('m:')) { $('#smeth', SV).value = a.slice(2); run(); }
});
SV.addEventListener('input', e => { if (e.target.classList.contains('bad')) { e.target.classList.remove('bad'); e.target.removeAttribute('aria-invalid'); } });
$('#sEx', SV).addEventListener('change', e => { if (e.target.value === '') return; const x = S.ex[+e.target.value]; load(x.p, x.m, true); e.target.value = ''; });
$('#sconv', SV).addEventListener('change', e => { S.conv = e.target.value; if (S.res && !$('#sres', SV).hidden && S.tab === 'steps') pane(); });

/* ---------- ejemplo resuelto ---------- */
function walkSteps(t) {
  const ex = t.examples[0], p = ex.p, m = ex.m, mm = (m === 'graph' || m === 'heur') ? 'auto' : m, d = IO.describe(p, mm), st = [];
  st.push({ h: 'Entiende el problema', html: `<p>${t.story}</p>` });
  st.push({ h: 'Escribe el modelo', html: `<div class="mdl">${d.model.join('<br>')}</div><p class="mut">Z es lo que queremos ${p.type === 'max' ? 'maximizar' : 'minimizar'}. Las restricciones R son los límites.</p>` });
  const res = IO.solve(p, mm);
  if (m === 'graph') {
    const g = IO.graph(p, res);
    st.push({ h: 'Dibuja las restricciones y la región factible', html: `<div class="leg">${g.legend}</div><div class="gwrap">${g.svg}</div><p>Cada recta es una restricción. La zona sombreada cumple todas a la vez: es la región factible.</p>`, after: el => setTimeout(() => g.play(el), 700) });
    st.push({ h: 'Calcula Z en cada vértice', html: '<p>El óptimo siempre está en una esquina. Evaluamos Z en cada una:</p>' + vtable(g, res, p) });
    st.push({ h: 'Elige el mejor y comprueba', html: banner(p, res) + checkHTML(p, res) });
  } else if (m === 'heur') {
    st.push({ h: 'Calcula la eficiencia y asigna', html: heurHTML(IO.heuristic(p), res) });
    st.push({ h: 'Compara con el óptimo exacto', html: banner(p, res) });
  } else {
    st.push({ h: 'Pasa a la forma estándar', html: `<div class="mdl">${d.std.join('<br>')}</div>` });
    res.steps.forEach((s, i) => st.push({ h: s.phase + ' · tabla ' + (i + 1), html: `<p>${stepMsg(s, S.conv)}</p>` + tableHTML(s, S.conv) }));
    st.push({ h: 'Respuesta y comprobación', html: banner(p, res) + checkHTML(p, res) });
  }
  return st;
}
function walkUI(root, t) {
  const steps = walkSteps(t); let k = 0;
  root.innerHTML = '<h2>Ejemplo resuelto paso a paso</h2><p class="mut">Mira cómo se resuelve un problema completo. Pulsa el botón para ir mostrando cada paso.</p><div class="wl"></div><div class="lb" style="margin-top:16px"><button class="btn red" data-w="n">Mostrar siguiente paso</button><button class="btn out" data-w="a">Mostrar todo</button><button class="btn out" data-w="r">Empezar de nuevo</button></div><p class="cap" id="wc"></p>';
  const wl = $('.wl', root);
  const add = () => {
    const s = steps[k]; const el = document.createElement('article'); el.className = 'ws';
    el.innerHTML = `<span class="wn">${k + 1}</span><div class="wb"><h3>${s.h}</h3>${s.html}</div>`; wl.appendChild(el); k++;
    if (s.after) s.after(el);
    sync();
  };
  const sync = () => {
    const done = k >= steps.length, n = $('[data-w="n"]', root), all = $('[data-w="a"]', root);
    n.disabled = done; all.disabled = done;
    n.textContent = done ? 'Ya mostraste todos los pasos' : 'Mostrar siguiente paso'; all.textContent = done ? 'Todo mostrado' : 'Mostrar todo';
    $('#wc', root).textContent = done ? `¡Listo! Ya viste los ${steps.length} pasos. Pulsa "Empezar de nuevo" si quieres repasar.` : `Paso ${k} de ${steps.length}`;
  };
  add();
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-w]'); if (!b) return;
    if (b.dataset.w === 'n' && k < steps.length) { add(); wl.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    else if (b.dataset.w === 'a') while (k < steps.length) add();
    else if (b.dataset.w === 'r') { wl.innerHTML = ''; k = 0; add(); }
  });
}

/* ---------- ejercicios de práctica ---------- */
const CLS = [['uni', 'Solución óptima única'], ['deg', 'Solución óptima degenerada'], ['alt', 'Óptimos alternativos'], ['unb', 'Solución no acotada'], ['inf', 'No factible']];
function exHTML(e, i, t) {
  let h = `<article class="ex" data-i="${i}"><h3>Ejercicio ${i + 1}</h3>`;
  if (e.t === 'mc') return h + `<p class="story">${e.q}</p>` + e.a.map((a, k) => `<button class="o" data-k="${k}">${a}</button>`).join('') + '<p class="fb" aria-live="polite"></p></article>';
  h += `<p class="story">${e.story}</p><div class="mdl">${IO.describe(e.p, 'auto').model.join('<br>')}</div>`;
  if (e.t === 'classify') h += `<div class="ans"><select data-k="cls" aria-label="Tipo de solución"><option value="">Elige el tipo de solución…</option>${CLS.map(c => `<option value="${c[0]}">${c[1]}</option>`).join('')}</select></div>`;
  else if (e.t === 'heur') h += '<div class="ans"><label>Z con la heurística <input type="text" data-k="Z" autocomplete="off" aria-label="Z con la heurística"></label></div>';
  else h += '<div class="ans">' + (e.ask === 'Z' ? '' : e.p.c.map((_, j) => `<label>x<sub>${j + 1}</sub> = <input type="text" data-k="x${j}" autocomplete="off" aria-label="Valor de x${j + 1}"></label>`).join('')) + '<label>Z = <input type="text" data-k="Z" autocomplete="off" aria-label="Valor de Z"></label></div>';
  h += `<div class="lb"><button class="btn red" data-a="check">Verificar</button><button class="btn out" data-a="hint">Pista</button>${t.tool ? '<button class="btn out" data-a="sol">Ver solución en el resolvedor</button>' : ''}</div><p class="fb" aria-live="polite"></p><p class="hn" hidden>${e.hint}</p></article>`;
  return h;
}
function checkEx(e, art) {
  const close = (inp, v) => { const q = IO.parseNum(inp); return isFinite(q.v) && Math.abs(q.v - v) <= (q.dec ? 0.011 : 1e-6); };
  const val = k => { const i = $(`[data-k="${k}"]`, art); return i ? i.value : ''; };
  if (e.t === 'classify') { const sel = val('cls'); return { ok: sel === IO.classify(e.p), empty: !sel, wrong: ['el tipo de solución'], answer: CLS.find(c => c[0] === IO.classify(e.p))[1] }; }
  if (e.t === 'heur') { const h = IO.heuristic(e.p); return { ok: close(val('Z'), h.z), empty: !val('Z').trim(), wrong: ['Z'], answer: 'Z = ' + IO.fr(h.z) }; }
  const r = IO.solve(e.p, 'auto'), wrong = []; let empty = false;
  if (e.ask !== 'Z') r.x.forEach((v, j) => { const s = val('x' + j); if (!s.trim()) empty = true; if (!close(s, v)) wrong.push('x' + (j + 1)); });
  if (!val('Z').trim()) empty = true; if (!close(val('Z'), r.z)) wrong.push('Z');
  return { ok: !wrong.length, empty, wrong, answer: (e.ask === 'Z' ? '' : r.x.map((v, j) => `x${j + 1} = ${IO.fr(v)}`).join(', ') + ', ') + 'Z = ' + IO.fr(r.z) };
}
function practiceUI(root, t) {
  root.innerHTML = '<details class="dt"><summary><span>Practica tú <em>(opcional)</em></span><small>Toca para ver los ejercicios</small></summary><div class="dtb"><p class="mut">Resuelve en tu cuaderno y comprueba tu respuesta. Puedes escribir fracciones como 15/2 o decimales como 7.5.</p>' + t.practice.map((e, i) => exHTML(e, i, t)).join('') + '</div></details>';
  root.addEventListener('click', ev => {
    const art = ev.target.closest('.ex'); if (!art) return; const e = t.practice[+art.dataset.i], fb = $('.fb', art);
    const set = (txt, cls) => { fb.textContent = txt; fb.className = 'fb ' + cls; };
    if (e.t === 'mc') {
      const b = ev.target.closest('.o'); if (!b) return; $$('.o', art).forEach(x => x.classList.remove('ok', 'no'));
      if (+b.dataset.k === e.ok) { b.classList.add('ok'); set('¡Correcto! ' + e.why, 'good'); } else { b.classList.add('no'); set('Casi. Vuelve a leer la lección e inténtalo otra vez.', 'bad'); } return;
    }
    const a = ev.target.closest('[data-a]'); if (!a) return;
    if (a.dataset.a === 'hint') { $('.hn', art).hidden = !$('.hn', art).hidden; return; }
    if (a.dataset.a === 'sol') { load(e.p, e.t === 'heur' ? 'heur' : 'auto', true); return; }
    const r = checkEx(e, art);
    if (r.empty) { set('Completa todas las casillas antes de verificar.', 'bad'); return; }
    art.dataset.n = (+art.dataset.n || 0) + (r.ok ? 0 : 1);
    if (r.ok) { set('¡Correcto! Muy bien.', 'good'); art.classList.add('done'); }
    else if (+art.dataset.n >= 3) set('Revisa ' + r.wrong.join(' y ') + '. La respuesta es: ' + r.answer + '. Pulsa "Ver solución" para ver cómo se llega.', 'bad');
    else set('Casi. Revisa ' + r.wrong.join(' y ') + ' e inténtalo de nuevo (usa la pista si la necesitas).', 'bad');
  });
}

/* ---------- páginas ---------- */
const view = $('#view');
function renderHome() {
  $('#tt').textContent = 'Inicio';
  view.innerHTML = `<div class="page"><section class="hero"><h1>Aprende Investigación de Operaciones jugando</h1><p>12 temas con animaciones, ejemplos resueltos, ejercicios con corrección y un resolvedor que te enseña cada paso.</p><div class="row"><a class="btn red" href="#/t/historia">Empezar por la historia</a><a class="btn out" href="#/solver">Ir al resolvedor</a></div></section>
<h2 class="st2">Temas</h2><div class="tgrid" id="grid">${TOP.map((t, i) => `<a class="tc2" href="#/t/${t.id}" style="--i:${i}"><span class="ic" style="background:${COLORS[i]};${COLORS[i] === '#FFC107' ? 'color:#072C50' : ''}">${i + 1}</span><h3>${NAV[t.id]}</h3><p>${t.short}</p></a>`).join('')}</div></div>`;
}
function lessonUI(root, steps, last) {
  let i = 0;
  const draw = () => {
    const lt = $('.lt', root); lt.textContent = steps[i]; lt.style.animation = 'none'; void lt.offsetWidth; lt.style.animation = '';
    $('.dots', root).innerHTML = steps.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
    $('[data-l="p"]', root).hidden = i === 0; $('[data-l="n"]', root).textContent = i === steps.length - 1 ? last[0] : 'Siguiente';
  };
  root.addEventListener('click', e => { const b = e.target.closest('[data-l]'); if (!b) return; if (b.dataset.l === 'p') { i--; draw(); } else if (i < steps.length - 1) { i++; draw(); } else last[1](); });
  draw();
}
function quizUI(root, q, id) {
  root.innerHTML = `<h2>Comprueba lo que aprendiste</h2><p class="mut">${q.q}</p>` + q.a.map((a, i) => `<button class="o" data-i="${i}">${a}</button>`).join('') + '<p class="qf" aria-live="polite"></p>';
  root.addEventListener('click', e => {
    const b = e.target.closest('.o'); if (!b) return; $$('.o', root).forEach(x => x.classList.remove('ok', 'no'));
    if (+b.dataset.i === q.ok) { b.classList.add('ok'); $('.qf', root).textContent = '¡Correcto! ' + q.why + ' Tema completado.'; store.add(id); buildNav(); markNav(); }
    else { b.classList.add('no'); $('.qf', root).textContent = 'Casi. Vuelve a leer la lección e inténtalo otra vez.'; }
  });
}
function renderTopic(t) {
  const i = TOP.indexOf(t), c = COLORS[i], prev = TOP[i - 1], next = TOP[i + 1];
  $('#tt').textContent = NAV[t.id];
  view.innerHTML = `<div class="page"><header class="tban" style="--c:${c}"><span class="tn" ${c === '#FFC107' ? 'style="color:#072C50"' : ''}>${i + 1}</span><div><h1>${t.title}</h1><p>${t.short}</p></div></header>
<section class="cards3">${t.cards.map(x => `<article class="card cc"><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join('')}</section>
<section class="card les" id="les"><div class="lh"><h2>Lección guiada</h2><div class="dots"></div></div><p class="lt"></p><div class="lb"><button class="btn out" data-l="p">Atrás</button><button class="btn red" data-l="n">Siguiente</button></div></section>
${t.kind === 'history' ? `<div class="tl" id="tl">${HIS.map(h => `<article class="ti"><span class="yr">${h[0]}</span><h3>${h[1]}</h3><p>${h[2]}</p></article>`).join('')}</div>` : ''}
${t.story ? '<section class="card" id="walk"></section>' : ''}<section class="card" id="prac"></section><div id="slot"></div><section class="card quiz" id="quiz"></section>
<nav class="pn">${prev ? `<a href="#/t/${prev.id}">← ${NAV[prev.id]}</a>` : '<span></span>'}${next ? `<a href="#/t/${next.id}">${NAV[next.id]} →</a>` : '<a href="#/solver">Resolvedor →</a>'}</nav></div>`;
  lessonUI($('#les'), t.lesson, t.tool ? ['Probar en el resolvedor', () => { const x = t.examples[0]; load(x.p, x.m, true); }] : ['Ir a la pregunta', () => $('#quiz').scrollIntoView({ behavior: 'smooth', block: 'center' })]);
  if (t.story) walkUI($('#walk'), t);
  practiceUI($('#prac'), t); quizUI($('#quiz'), t.quiz, t.id);
  if (t.tool) { $('#slot').appendChild(SV); setExamples(t.examples); load(t.examples[0].p, t.examples[0].m, false); $('#sres', SV).hidden = true; }
  if (t.kind === 'history') revealTimeline();
}
function revealTimeline() {
  const items = $$('.ti'); if (!('IntersectionObserver' in window)) { items.forEach(x => x.classList.add('show')); return; }
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('show'); io.unobserve(en.target); } }), { threshold: .2 });
  items.forEach(x => io.observe(x));
}
function renderSolver() {
  $('#tt').textContent = 'Resolvedor';
  view.innerHTML = '<div class="page"><header class="tban" style="--c:#712CF9"><span class="tn">Σ</span><div><h1>Resolvedor</h1><p>Resuelve tus propios problemas de programación lineal y mira cada paso.</p></div></header><div id="slot"></div></div>';
  $('#slot').appendChild(SV); setExamples(S.all);
}
function markNav() { const k = current(); $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.r === k)); }
function current() { const h = location.hash.replace(/^#\/?/, '') || 'home', [r, id] = h.split('/'); return r === 't' && TOP.some(t => t.id === id) ? 't/' + id : r === 'solver' ? 'solver' : 'home'; }
function route() {
  stop(); document.body.classList.remove('open'); SV.remove();
  const k = current();
  if (k === 'home') renderHome(); else if (k === 'solver') renderSolver(); else renderTopic(TOP.find(t => 't/' + t.id === k));
  markNav(); window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
$('#bMenu').onclick = () => document.body.classList.toggle('open');
$('#scrim').onclick = () => document.body.classList.remove('open');

/* ---------- tutorial ---------- */
const mob = () => innerWidth <= 900;
const steps = [
  { h: '¡Hola! Bienvenido', p: 'Esta plataforma te enseña Investigación de Operaciones con animaciones, ejemplos resueltos, ejercicios y un resolvedor. Te muestro cómo usarla en 4 pasos.' },
  { t: () => mob() ? '#bMenu' : '#side', h: '1. Menú de temas', p: 'Aquí están los 12 temas, desde la historia hasta los casos especiales del Simplex. Los que completes se marcan con una palomita.' },
  { t: () => $('.tgrid') ? '.tgrid' : '#view', h: '2. Cada tema tiene 5 partes', p: 'Explicación con ejemplos, lección guiada, un ejemplo resuelto paso a paso, ejercicios opcionales con corrección y una pregunta final.' },
  { t: () => mob() ? '#bMenu' : 'a[data-r="solver"]', h: '3. El resolvedor', p: 'Escribe tu problema o carga un ejemplo y elige un método. Verás el modelo, las tablas del Simplex, la gráfica y la comprobación.' },
  { t: () => '#bAbout', h: '4. Quién lo hizo', p: 'Aquí están los integrantes del equipo. ¡Ahora empieza a aprender!' }
];
let si = 0;
function tutOpen() { si = 0; document.body.classList.remove('open'); $('#tut').classList.add('on'); $('#dots').innerHTML = steps.map(() => '<i></i>').join(''); tshow(); }
function tutClose() { $('#tut').classList.remove('on'); try { localStorage.setItem('ioTut2', '1'); } catch (e) {} }
function tshow() {
  const s = steps[si]; $('#th').textContent = s.h; $('#tp').textContent = s.p;
  $('#tPrev').style.visibility = si ? 'visible' : 'hidden'; $('#tNext').textContent = si === steps.length - 1 ? 'Empezar' : 'Siguiente';
  $$('#dots i').forEach((d, i) => d.classList.toggle('on', i === si));
  const t = s.t && $(s.t()); if (t && t.scrollIntoView) t.scrollIntoView({ block: 'center', behavior: 'smooth' });
  setTimeout(place, t ? 550 : 30);
}
function place() {
  const s = steps[si], t = s.t && $(s.t()), sp = $('#spot'), tip = $('#tip'), w = Math.min(370, innerWidth - 24); tip.style.width = w + 'px';
  if (!t) { sp.style.cssText = 'left:50%;top:50%;width:0;height:0'; tip.style.left = (innerWidth - w) / 2 + 'px'; tip.style.top = Math.max(12, (innerHeight - tip.offsetHeight) / 2) + 'px'; return; }
  const r = t.getBoundingClientRect(), p = 10, th = tip.offsetHeight;
  sp.style.left = r.left - p + 'px'; sp.style.top = r.top - p + 'px'; sp.style.width = r.width + p * 2 + 'px'; sp.style.height = Math.min(r.height, innerHeight - 20) + p * 2 + 'px';
  const x = Math.max(12, Math.min(r.left, innerWidth - w - 12));
  const y = r.bottom + p + th + 16 < innerHeight ? r.bottom + p + 14 : r.top - p - th - 16 > 0 ? r.top - p - th - 14 : innerHeight - th - 14;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
$('#tNext').onclick = () => { if (si < steps.length - 1) { si++; tshow(); } else tutClose(); };
$('#tPrev').onclick = () => { if (si > 0) { si--; tshow(); } };
$('#tSkip').onclick = tutClose; $('#bTut').onclick = tutOpen;
const redo = () => { if ($('#tut').classList.contains('on')) place(); };
window.addEventListener('resize', redo); window.addEventListener('scroll', redo, { passive: true });
document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if ($('#tut').classList.contains('on')) tutClose(); document.body.classList.remove('open'); });

/* ---------- equipo e inicio ---------- */
$('#bAbout').onclick = () => $('#about').showModal();
$('#fAbout').onclick = () => $('#about').showModal();
$('#aClose').onclick = () => $('#about').close();
$('#about').addEventListener('click', e => { if (e.target === $('#about')) $('#about').close(); });
fillSelect(); form(); buildNav(); route();
setTimeout(() => $('#intro').classList.add('gone'), 1900);
setTimeout(() => { let seen = false; try { seen = localStorage.getItem('ioTut2'); } catch (e) {} if (!seen) tutOpen(); }, 3500);
})();

// ================= Cuentas de jugador (Firebase) =================
// Cada niño entra con su nombre + PIN de 6 números. Papá aprueba las cuentas en admin.html.
// El avance del juego (las llaves ah_* de progreso) se guarda en Firestore en players/{uid}.save
const FB_VER = '10.14.1';
import { firebaseConfig } from './cuenta-config.js';
const PROG_KEYS = ['ah_profiles', 'ah_stars', 'ah_crys', 'ah_traje', 'ah_unlocked', 'ah_team', 'ah_resume'];
const MAIL_DOMAIN = 'jugadores.alianza-heroica.app';
export const nameKey = n => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const HEROS = [['volta', '⚡', '#ffd23f'], ['roca', '🪨', '#c26a2c'], ['brisa', '🌪️', '#3ddc84'], ['sombra', '🌑', '#8e44ad'], ['escarcha', '❄️', '#7fe3ff'], ['fenix', '🔥', '#ff5a1a']];

// ---------- guardado local + sincronización ----------
const rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem;
let F = null, user = null, doc0 = null, syncT = null, ready = false;
const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { rawSet.call(localStorage, k, v); } catch (e) { } }, del: k => { try { rawRemove.call(localStorage, k); } catch (e) { } } };
const snapshot = () => { const o = {}; for (const k of PROG_KEYS) { const v = ls.get(k); if (v != null) o[k] = v; } return o; };
const hasLocalProgress = () => PROG_KEYS.some(k => ls.get(k) != null);
Storage.prototype.setItem = function (k, v) { rawSet.call(this, k, v); if (this === localStorage && PROG_KEYS.includes(k)) queueSync(); };
function queueSync() { if (!ready) return; clearTimeout(syncT); syncT = setTimeout(pushSave, 2500); }
async function pushSave() { if (!ready || !F || !user) return; try { await F.updateDoc(F.doc(F.db, 'players', user.uid), { save: snapshot(), updatedAt: F.serverTimestamp(), lastSeen: F.serverTimestamp() }); ls.set('ah_synced', String(Date.now() + 60000)); setNet(true); } catch (e) { console.warn('guardar en la nube', e); setNet(false); } }
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { clearTimeout(syncT); pushSave(); } });
addEventListener('pagehide', () => { clearTimeout(syncT); pushSave(); });

// ---------- interfaz ----------
const css = `#acc{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 30% 20%,#2b3a8a,#120a2a 70%);font-family:Nunito,system-ui,sans-serif;color:#fff;overflow:auto}
#acc .card{width:min(560px,92vw);background:rgba(255,255,255,.08);border:3px solid rgba(255,255,255,.25);border-radius:24px;padding:22px 24px;box-shadow:0 12px 40px rgba(0,0,0,.5);text-align:center}
#acc h1{font-family:Bangers,Impact,sans-serif;letter-spacing:3px;font-size:44px;margin:0 0 4px;color:#ffd23f;text-shadow:0 4px 0 #000}#acc h2{font-family:Bangers,Impact,sans-serif;letter-spacing:2px;font-size:30px;margin:6px 0 12px}
#acc p{font-size:18px;font-weight:700;margin:8px 0;line-height:1.35}#acc .err{color:#ff8a9a;min-height:24px;font-weight:800}
#acc button{font-family:inherit;font-weight:900;font-size:20px;border:0;border-radius:16px;padding:12px 18px;margin:6px;cursor:pointer;background:#ffd23f;color:#111;box-shadow:0 4px 0 #a07a00}
#acc button.alt{background:#7fd8ff;box-shadow:0 4px 0 #2a6a9a}#acc button.gh{background:transparent;color:#fff;box-shadow:none;text-decoration:underline;font-size:16px}
#acc input{font-family:inherit;font-size:24px;font-weight:800;padding:10px 14px;border-radius:14px;border:3px solid #fff;width:80%;text-align:center;margin:6px 0}
#acc .pin{display:flex;gap:8px;justify-content:center;margin:10px 0}#acc .pin i{width:34px;height:42px;border-radius:10px;background:rgba(255,255,255,.15);border:2px solid #fff;font-style:normal;font-size:26px;line-height:42px}
#acc .pad{display:grid;grid-template-columns:repeat(3,76px);gap:8px;justify-content:center}#acc .pad button{margin:0;font-size:28px;padding:12px 0;background:#fff}
#acc .who{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:10px 0}#acc .who button{min-width:130px;background:#fff}
#acc .heroes{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:6px 0}#acc .heroes button{font-size:28px;width:62px;height:62px;padding:0;background:rgba(255,255,255,.15);box-shadow:none;border:3px solid transparent}
#acc .heroes button.on{border-color:#ffd23f;background:rgba(255,210,63,.3)}
#acc .spin{width:44px;height:44px;border:5px solid rgba(255,255,255,.25);border-top-color:#ffd23f;border-radius:50%;margin:14px auto;animation:accs 1s linear infinite}@keyframes accs{to{transform:rotate(360deg)}}
#accbar{position:fixed;left:12px;bottom:10px;z-index:60;font-family:Nunito,system-ui,sans-serif;font-weight:800;font-size:14px;background:rgba(0,0,0,.55);color:#fff;border-radius:14px;padding:6px 12px;display:none;align-items:center;gap:8px}
#accbar button{font:inherit;border:0;border-radius:10px;padding:4px 10px;background:#ffd23f;cursor:pointer}#accbar .dot{width:9px;height:9px;border-radius:50%;background:#7dff9a}#accbar .dot.off{background:#ff8a3d}`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
const box = document.createElement('div'); box.id = 'acc'; document.body.appendChild(box);
const bar = document.createElement('div'); bar.id = 'accbar'; document.body.appendChild(bar);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function show(html) { box.style.display = 'flex'; box.innerHTML = `<div class="card">${html}</div>`; }
function hide() { box.style.display = 'none'; }
function setNet(ok) { const d = bar.querySelector('.dot'); if (d) d.classList.toggle('off', !ok); }
function showBar(name) { bar.style.display = 'flex'; bar.innerHTML = `<span class="dot"></span>🎮 ${esc(name)}${isDad(user) ? '<a href="admin.html?v=6" target="_blank" rel="noopener" style="background:#7fd8ff;color:#111;border-radius:10px;padding:4px 10px;text-decoration:none">⚙️ Panel de administrador</a>' : ''}<button id="acc-out">Cambiar jugador</button>`; bar.querySelector('#acc-out').onclick = logout; }
const recent = () => { try { return JSON.parse(ls.get('ah_recent') || '[]'); } catch (e) { return []; } };
const addRecent = n => { const r = recent().filter(x => nameKey(x) !== nameKey(n)); r.unshift(n); ls.set('ah_recent', JSON.stringify(r.slice(0, 6))); };

function pinPad(onDone, title) {
  let pin = ''; const err = '<div class="err" id="acc-err"></div>';
  const draw = () => { box.querySelector('.pin').innerHTML = [...Array(6)].map((_, i) => `<i>${i < pin.length ? '●' : ''}</i>`).join(''); };
  return {
    html: `<p>${title}</p><div class="pin"></div>${err}<div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✔'].map(k => `<button data-k="${k}">${k}</button>`).join('')}</div>`,
    bind() {
      draw(); box.querySelectorAll('.pad button').forEach(b => b.onclick = () => {
        const k = b.dataset.k; if (k === '⌫') pin = pin.slice(0, -1); else if (k === '✔') { if (pin.length === 6) onDone(pin); else msg('El PIN tiene 6 números'); } else if (pin.length < 6) pin += k;
        draw(); if (pin.length === 6 && k !== '✔') setTimeout(() => onDone(pin), 120);
      });
    }, reset() { pin = ''; draw(); }
  };
}
const msg = t => { const e = document.getElementById('acc-err'); if (e) e.textContent = t; };

function screenWho() {
  const r = recent();
  show(`<h1>ALIANZA HEROICA</h1><h2>¿Quién va a jugar?</h2>
    <div class="who">${r.map(n => `<button data-n="${esc(n)}">${esc(n)}</button>`).join('')}</div>
    <button class="alt" id="acc-other">${r.length ? 'Otro jugador' : 'Ya tengo cuenta'}</button><button id="acc-new">Soy nuevo</button><br><button class="gh" id="acc-dad">👨 Soy Papá</button>`);
  box.querySelector('#acc-dad').onclick = screenDad;
  box.querySelectorAll('.who button').forEach(b => b.onclick = () => screenLogin(b.dataset.n));
  box.querySelector('#acc-other').onclick = () => screenLogin('');
  box.querySelector('#acc-new').onclick = screenNew;
}
function screenDad() {
  show(`<h2>Hola, Papá</h2><form id="acc-f" autocomplete="on" onsubmit="return false"><input id="acc-em" type="email" autocomplete="username" placeholder="Tu correo"><input id="acc-pw" type="password" autocomplete="current-password" placeholder="Tu contraseña">
    <div class="err" id="acc-err"></div><button id="acc-ok" type="submit">Entrar</button></form><p style="font-size:14px;opacity:.75;margin-top:14px">¿Primera vez? Escribe tu correo y una contraseña nueva (mínimo 8 caracteres):</p>
    <button class="alt" id="acc-mk">Crear cuenta de Papá</button><br><button class="gh" id="acc-back">← Volver</button>`);
  const v = () => [box.querySelector('#acc-em').value.trim(), box.querySelector('#acc-pw').value];
  box.querySelector('#acc-back').onclick = screenWho;
  box.querySelector('#acc-ok').onclick = async () => { const [e, p] = v(); if (!e || !p) return msg('Escribe tu correo y contraseña'); msg('Entrando…'); try { await F.signInWithEmailAndPassword(F.auth, e, p); } catch (er) { msg(/too-many/.test(er.code || '') ? 'Demasiados intentos. Espera un momento.' : 'Correo o contraseña incorrectos'); } };
  box.querySelector('#acc-mk').onclick = async () => { const [e, p] = v(); if (p.length < 8) return msg('Usa una contraseña de al menos 8 caracteres'); msg('Creando…'); try { await F.createUserWithEmailAndPassword(F.auth, e, p); } catch (er) { msg(/already/.test(er.code || '') ? 'Ese correo ya tiene cuenta: usa Entrar' : /invalid-email/.test(er.code || '') ? 'Ese correo no es válido' : 'No se pudo crear: ' + er.code); } };
}
async function mailFor(name) { const key = nameKey(name); let v = 1; try { const d = await F.getDoc(F.doc(F.db, 'logins', key)); if (d.exists()) v = d.data().v || 1; } catch (e) { } return key + (v > 1 ? '.' + v : '') + '@' + MAIL_DOMAIN; }
const isDad = u => u && u.email && !u.email.endsWith('@' + MAIL_DOMAIN);
function screenLogin(name) {
  if (!name) {
    show(`<h2>¿Cómo te llamas?</h2><input id="acc-name" maxlength="14" autocomplete="off" placeholder="Tu nombre"><div class="err" id="acc-err"></div><button id="acc-ok">Siguiente</button><br><button class="gh" id="acc-back">← Volver</button>`);
    const i = box.querySelector('#acc-name'); i.focus();
    box.querySelector('#acc-ok').onclick = () => { const v = i.value.trim(); if (nameKey(v).length < 2) return msg('Escribe tu nombre'); screenLogin(v); };
    box.querySelector('#acc-back').onclick = screenWho; return;
  }
  const P = pinPad(async pin => {
    msg('Entrando…');
    try { await F.signInWithEmailAndPassword(F.auth, await mailFor(name), pin); addRecent(name); }
    catch (e) { P.reset(); msg(/invalid|wrong|not-found|credential/.test(e.code || '') ? 'Nombre o PIN incorrecto' : /too-many/.test(e.code || '') ? 'Demasiados intentos. Espera un momento.' : 'No se pudo entrar. Revisa el internet.'); }
  }, `Hola <b>${esc(name)}</b>, escribe tu PIN`);
  show(`<h2>${esc(name)}</h2>${P.html}<button class="gh" id="acc-back">← No soy yo</button>`); P.bind();
  box.querySelector('#acc-back').onclick = screenWho;
}
function screenNew() {
  let hero = 'volta';
  show(`<h2>Crear jugador</h2><input id="acc-name" maxlength="14" autocomplete="off" placeholder="Tu nombre"><p>Elige tu héroe favorito</p>
    <div class="heroes">${HEROS.map(([k, e]) => `<button data-h="${k}" class="${k === hero ? 'on' : ''}">${e}</button>`).join('')}</div><div class="err" id="acc-err"></div>
    <button id="acc-ok">Siguiente</button><br><button class="gh" id="acc-back">← Volver</button>`);
  box.querySelectorAll('.heroes button').forEach(b => b.onclick = () => { hero = b.dataset.h; box.querySelectorAll('.heroes button').forEach(x => x.classList.toggle('on', x === b)); });
  box.querySelector('#acc-back').onclick = screenWho;
  box.querySelector('#acc-ok').onclick = () => {
    const name = box.querySelector('#acc-name').value.trim().replace(/\s+/g, ' ');
    if (nameKey(name).length < 2) return msg('Escribe tu nombre (mínimo 2 letras)');
    let first = null;
    const ask = (title) => { const P = pinPad(async pin => {
      if (!first) { first = pin; ask('Escríbelo otra vez para confirmar'); return; }
      if (pin !== first) { first = null; ask('No coincidió. Inventa tu PIN de nuevo'); return; }
      msg('Creando tu cuenta…');
      try {
        try { const ex = await F.getDoc(F.doc(F.db, 'logins', nameKey(name))); if (ex.exists()) throw { code: 'email-already-in-use' }; } catch (e) { if (e.code === 'email-already-in-use') throw e; }
        const cred = await F.createUserWithEmailAndPassword(F.auth, nameKey(name) + '@' + MAIL_DOMAIN, pin);
        await F.setDoc(F.doc(F.db, 'players', cred.user.uid), { name, nameKey: nameKey(name), avatar: hero, status: 'pending', createdAt: F.serverTimestamp(), lastSeen: F.serverTimestamp(), save: {}, updatedAt: F.serverTimestamp() });
        try { await F.setDoc(F.doc(F.db, 'logins', nameKey(name)), { v: 1, uid: cred.user.uid }); } catch (e) { }
        addRecent(name);
      } catch (e) { first = null; P.reset(); msg(/email-already/.test(e.code || '') ? 'Ese nombre ya existe. Elige otro o entra con tu PIN.' : /weak/.test(e.code || '') ? 'El PIN debe tener 6 números' : 'No se pudo crear. Revisa el internet.'); }
    }, title); show(`<h2>${esc(name)}</h2><p>Inventa un PIN secreto de 6 números. ¡No se lo digas a nadie!</p>${P.html}<button class="gh" id="acc-back">← Volver</button>`); P.bind(); box.querySelector('#acc-back').onclick = screenNew; };
    ask('Tu PIN');
  };
}
function screenWait(d) {
  show(`<h1>¡Listo, ${esc(d.name)}!</h1><p>Tu cuenta ya está creada.</p><p>Ahora pídele a papá que te <b>autorice</b> para entrar a jugar.</p><div class="spin"></div><p style="opacity:.75;font-size:15px">Esta pantalla se abre sola cuando te autoricen.</p><button class="gh" id="acc-out2">Salir</button>`);
  box.querySelector('#acc-out2').onclick = logout;
}
function screenBlocked(d) { show(`<h2>Cuenta en pausa</h2><p>${esc(d.name)}, tu cuenta no puede entrar por ahora. Habla con papá.</p><button class="alt" id="acc-out2">Cambiar jugador</button>`); box.querySelector('#acc-out2').onclick = logout; }
function screenOffline() {
  show(`<h2>Sin conexión</h2><p>No se pudo conectar con el servidor de cuentas.</p><p style="font-size:15px;opacity:.8">Puedes jugar con lo guardado en este iPad; el avance se subirá cuando vuelvas a entrar con internet.</p>
    <button id="acc-local">Jugar en este iPad</button><button class="alt" id="acc-retry">Reintentar</button>`);
  box.querySelector('#acc-local').onclick = hide; box.querySelector('#acc-retry').onclick = () => location.reload();
}
function screenMine(d, onYes, onNo) {
  show(`<h2>¡Bienvenido, ${esc(d.name)}!</h2><p>Este iPad ya tiene avance guardado (niveles, estrellas y cristales).</p><p><b>¿Ese avance es tuyo?</b></p><button id="acc-yes">Sí, es mío</button><button class="alt" id="acc-no">No, empezar desde cero</button>`);
  box.querySelector('#acc-yes').onclick = onYes; box.querySelector('#acc-no').onclick = onNo;
}

async function logout() { clearTimeout(syncT); await pushSave(); ready = false; try { await F.signOut(F.auth); } catch (e) { } location.reload(); }

// ---------- arranque ----------
function loadSaveIntoDevice(uid, save) { for (const k of PROG_KEYS) ls.del(k); for (const k in (save || {})) if (PROG_KEYS.includes(k)) ls.set(k, save[k]); ls.set('ah_owner', uid); }
async function enter(u) {
  const ref = F.doc(F.db, 'players', u.uid);
  let snap;
  try { snap = await F.getDoc(ref); } catch (e) { if (ls.get('ah_owner') === u.uid) { hide(); showBar('…'); return; } return screenOffline(); }
  if (!snap.exists() && isDad(u)) {
    try { await F.setDoc(ref, { name: 'Papá', nameKey: 'papa', avatar: 'fenix', status: 'pending', createdAt: F.serverTimestamp(), lastSeen: F.serverTimestamp(), save: {}, updatedAt: F.serverTimestamp() }); await F.updateDoc(ref, { status: 'approved' }); return enter(u); }
    catch (e) { show(`<h2>Falta un paso</h2><p>Tu cuenta de Papá ya existe, pero Firebase todavía no sabe que eres el administrador.</p><p style="font-size:15px">Pega las reglas de seguridad con tu correo en Firestore → Reglas, publícalas y vuelve a intentar.</p><button id="acc-retry">Reintentar</button><button class="alt" id="acc-out2">Salir</button>`); box.querySelector('#acc-retry').onclick = () => enter(u); box.querySelector('#acc-out2').onclick = logout; return; }
  }
  if (!snap.exists()) { show(`<h2>Cuenta incompleta</h2><p>Esta cuenta no tiene datos. Pídele a papá que la revise.</p><button class="alt" id="acc-out2">Cambiar jugador</button>`); box.querySelector('#acc-out2').onclick = logout; return; }
  doc0 = snap.data();
  if (doc0.status === 'blocked') return screenBlocked(doc0);
  if (doc0.status !== 'approved') {
    screenWait(doc0);
    const un = F.onSnapshot(ref, s => { const d = s.data(); if (d && d.status === 'approved') { un(); enter(u); } else if (d && d.status === 'blocked') { un(); screenBlocked(d); } }, () => { });
    return;
  }
  const cloud = doc0.save || {}, cloudHas = Object.keys(cloud).length > 0, owner = ls.get('ah_owner');
  const go = () => { ready = true; hide(); showBar(doc0.name); F.updateDoc(ref, { lastSeen: F.serverTimestamp() }).catch(() => { }); window.__player = { uid: u.uid, name: doc0.name }; };
  if (owner === u.uid) { // este iPad ya tiene los datos de este jugador
    if (cloudHas && JSON.stringify(cloud) !== JSON.stringify(snapshot()) && (!doc0.updatedAt || +(ls.get('ah_synced') || 0) < doc0.updatedAt.toMillis())) { loadSaveIntoDevice(u.uid, cloud); ls.set('ah_synced', String(Date.now())); return location.reload(); }
    go(); queueSync(); return;
  }
  if (cloudHas) { loadSaveIntoDevice(u.uid, cloud); ls.set('ah_synced', String(Date.now())); return location.reload(); }
  // cuenta nueva sin avance en la nube
  if (!owner && hasLocalProgress()) return screenMine(doc0, async () => { ls.set('ah_owner', u.uid); ready = true; await pushSave(); go(); }, () => { loadSaveIntoDevice(u.uid, {}); location.reload(); });
  if (owner && owner !== u.uid) { loadSaveIntoDevice(u.uid, {}); return location.reload(); }
  ls.set('ah_owner', u.uid); go();
}

(async () => {
  show(`<h1>ALIANZA HEROICA</h1><div class="spin"></div><p>Conectando…</p>`);
  const to = setTimeout(() => { if (!F) screenOffline(); }, 9000);
  try {
    const base = `https://www.gstatic.com/firebasejs/${FB_VER}/`;
    const [A, U, D] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
    const app = A.initializeApp(firebaseConfig);
    F = { auth: U.getAuth(app), db: D.getFirestore(app), ...U, ...D };
    clearTimeout(to);
    let first = true;
    F.onAuthStateChanged(F.auth, u => { user = u; if (u) enter(u); else { ready = false; if (first || box.style.display !== 'none') screenWho(); } first = false; });
  } catch (e) { console.warn('firebase', e); clearTimeout(to); screenOffline(); }
})();

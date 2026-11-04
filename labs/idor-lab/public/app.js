const $ = id => document.getElementById(id);
const state = { mode: 'vulnerable', notes: [], demoId: null };
function badge(status) {
  const label = status === 200 ? '200 OK' : status === 403 ? '403 FORBIDDEN' : status === 404 ? '404 NOT FOUND' : `${status} ERROR`;
  $('http-badge').textContent = label;
  $('http-badge').className = `status ${status === 200 ? 'ok' : status === 403 ? 'denied' : 'error'}`;
}
function message(text, kind = '') {
  const out = $('output'); out.replaceChildren();
  const p = document.createElement('p'); p.textContent = text; p.className = kind; out.append(p);
}
function setModeUI() {
  for (const mode of ['vulnerable', 'protected']) {
    $(''+mode).classList.toggle('active', state.mode === mode);
    $(''+mode).setAttribute('aria-pressed', String(state.mode === mode));
  }
}
function renderList() {
  const list = $('list'); list.replaceChildren();
  for (const note of state.notes) {
    const button = document.createElement('button'); button.className = 'note-row'; button.type = 'button';
    const title = document.createElement('strong'); title.textContent = `#${note.id}`;
    const body = document.createElement('span'); body.textContent = note.body;
    button.append(title, body); button.addEventListener('click', () => openNote(note.id)); list.append(button);
  }
}
async function json(url, options) {
  const res = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...options });
  const data = await res.json(); return { res, data };
}
async function boot() {
  try {
    const { res, data } = await json('/api/session');
    if (!res.ok) throw new Error(data.error || 'Session unavailable');
    state.mode = data.mode; state.notes = data.notes; state.demoId = data.demoNoteId;
    setModeUI(); renderList(); $('sam-hint').textContent = `note #${state.demoId}`;
    $('sam-hint').onclick = () => openNote(state.demoId);
    const id = location.pathname.match(/^\/notes\/([1-9]\d*)$/)?.[1] || state.notes.at(-1)?.id;
    if (id) await openNote(Number(id), false);
  } catch (err) { message(`Could not initialize sandbox: ${err.message}`, 'denied-text'); }
}
async function openNote(id, navigate = true) {
  if (!Number.isSafeInteger(id) || id < 1) return message('Enter a valid positive note ID.');
  $('url-id').value = String(id); $('request-path').textContent = `GET /api/notes/${id}`;
  if (navigate) history.pushState({}, '', `/notes/${id}`);
  try {
    const { res, data } = await json(`/api/notes/${id}`); badge(res.status);
    if (!res.ok) return message(data.error || 'Request failed.', 'denied-text');
    const who = data.owner === 'alex' ? 'Alex (you)' : 'Sam (another demo user)';
    const out = $('output'); out.replaceChildren();
    const heading = document.createElement('h2'); heading.textContent = `Note #${data.id}`;
    const owner = document.createElement('p'); owner.className = 'owner'; owner.textContent = `Owner: ${who}`;
    const body = document.createElement('p'); body.className = 'note-body'; body.textContent = data.body;
    out.append(heading, owner, body);
    if (data.owner !== 'alex') {
      const alert = document.createElement('p'); alert.className = 'warn-text';
      alert.textContent = '⚠ IDOR reproduced: Alex read Sam’s note without being authorized.'; out.append(alert);
    }
  } catch { badge(500); message('Network error. Try again.', 'denied-text'); }
}
for (const mode of ['vulnerable', 'protected']) $(''+mode).addEventListener('click', async () => {
  try {
    const { res, data } = await json('/api/mode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }) });
    if (!res.ok) throw new Error(data.error);
    state.mode = data.mode; setModeUI();
    const id = Number($('url-id').value) || state.demoId; if (id) await openNote(id);
  } catch (err) { message(`Could not change mode: ${err.message}`, 'denied-text'); }
});
$('open-note').addEventListener('click', () => openNote(Number($('url-id').value)));
$('url-id').addEventListener('keydown', event => { if (event.key === 'Enter') openNote(Number(event.currentTarget.value)); });
$('create-note').addEventListener('submit', async event => {
  event.preventDefault(); const text = $('new-note').value;
  try {
    const { res, data } = await json('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    if (!res.ok) throw new Error(data.error);
    state.notes.unshift(data); renderList(); $('new-note').value = ''; await openNote(data.id);
  } catch (err) { message(`Could not save note: ${err.message}`, 'denied-text'); }
});
window.addEventListener('popstate', () => { const id = Number(location.pathname.match(/^\/notes\/(\d+)$/)?.[1]); if (id) openNote(id, false); });
boot();

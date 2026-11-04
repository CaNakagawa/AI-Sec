// Educational IDOR lab. Deliberately vulnerable ONLY inside each visitor's synthetic sandbox.
const SESSION_COOKIE = 'ai_sec_lab';
const LAB_MAX_AGE = 60 * 60 * 2;
const SEED_ALEX = 'Alex: Draft the presentation outline (demo data).';
const SEED_SAM = 'Sam: Private invoice draft (demo data, not a real invoice).';

const reply = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', ...extra },
});
function token() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
async function digest(value) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}
function readCookie(request) {
  const match = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)ai_sec_lab=([0-9a-f]{64})(?:;|$)/);
  return match?.[1] || null;
}
function sessionCookie(value) {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${LAB_MAX_AGE}`;
}
function validMutation(request) {
  const origin = request.headers.get('Origin');
  const type = request.headers.get('Content-Type') || '';
  return origin === new URL(request.url).origin && /^application\/json(?:\s*;|$)/i.test(type);
}
async function getLab(request, env, create = false) {
  const sid = readCookie(request);
  if (sid) {
    const lab = await env.DB.prepare('SELECT id, mode FROM labs WHERE token_hash = ? AND created_at > ?')
      .bind(await digest(sid), Date.now() - LAB_MAX_AGE * 1000).first();
    if (lab) return { lab, sid, fresh: false };
  }
  if (!create) return null;
  const newSid = token();
  const result = await env.DB.prepare('INSERT INTO labs (token_hash, mode, created_at) VALUES (?, ?, ?)')
    .bind(await digest(newSid), 'vulnerable', Date.now()).run();
  const labId = result.meta.last_row_id;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO notes (lab_id, owner, body, is_seed) VALUES (?, ?, ?, 1)').bind(labId, 'alex', SEED_ALEX),
    env.DB.prepare('INSERT INTO notes (lab_id, owner, body, is_seed) VALUES (?, ?, ?, 1)').bind(labId, 'sam', SEED_SAM),
  ]);
  return { lab: { id: labId, mode: 'vulnerable' }, sid: newSid, fresh: true };
}

async function api(request, env, url) {
  const path = url.pathname;
  const isPost = request.method === 'POST';
  if (!['GET', 'POST'].includes(request.method)) return reply({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST' });
  if (isPost && !validMutation(request)) return reply({ error: 'Same-origin JSON request required' }, 403);
  if (path === '/api/session' && request.method === 'GET') {
    const session = await getLab(request, env, true);
    const owned = await env.DB.prepare('SELECT id, body FROM notes WHERE lab_id = ? AND owner = ? ORDER BY id DESC')
      .bind(session.lab.id, 'alex').all();
    const demo = await env.DB.prepare('SELECT id FROM notes WHERE lab_id = ? AND owner = ? AND is_seed = 1 ORDER BY id LIMIT 1')
      .bind(session.lab.id, 'sam').first();
    return reply({ mode: session.lab.mode, actor: 'alex', notes: owned.results, demoNoteId: demo?.id || null }, 200,
      session.fresh ? { 'Set-Cookie': sessionCookie(session.sid) } : {});
  }
  const session = await getLab(request, env);
  if (!session) return reply({ error: 'Session expired. Reload the page to get a new sandbox.' }, 401);
  if (path === '/api/mode' && isPost) {
    let body; try { body = await request.json(); } catch { return reply({ error: 'Invalid JSON' }, 400); }
    if (body?.mode !== 'vulnerable' && body?.mode !== 'protected') return reply({ error: 'Invalid mode' }, 400);
    await env.DB.prepare('UPDATE labs SET mode = ? WHERE id = ?').bind(body.mode, session.lab.id).run();
    return reply({ mode: body.mode });
  }
  if (path === '/api/notes' && isPost) {
    let body; try { body = await request.json(); } catch { return reply({ error: 'Invalid JSON' }, 400); }
    if (typeof body?.text !== 'string' || body.text.trim().length < 1 || body.text.length > 240)
      return reply({ error: 'Write 1–240 characters of synthetic demo text.' }, 400);
    const count = await env.DB.prepare('SELECT COUNT(*) AS total FROM notes WHERE lab_id = ?').bind(session.lab.id).first();
    if (count.total >= 10) return reply({ error: 'Sandbox limit reached (10 notes).' }, 429);
    const added = await env.DB.prepare('INSERT INTO notes (lab_id, owner, body, is_seed) VALUES (?, ?, ?, 0)')
      .bind(session.lab.id, 'alex', body.text.trim()).run();
    return reply({ id: added.meta.last_row_id, owner: 'alex', body: body.text.trim() }, 201);
  }
  const match = path.match(/^\/api\/notes\/([1-9]\d*)$/);
  if (match && request.method === 'GET') {
    const note = await env.DB.prepare('SELECT id, owner, body FROM notes WHERE id = ? AND lab_id = ?')
      .bind(Number(match[1]), session.lab.id).first();
    if (!note) return reply({ error: 'Note not found in this sandbox.' }, 404);
    // INTENTIONALLY VULNERABLE: in this mode, ownership is not enforced.
    // The lab_id predicate above ALWAYS prevents cross-participant access.
    if (session.lab.mode === 'protected' && note.owner !== 'alex')
      return reply({ error: 'Forbidden: this note belongs to another user.' }, 403);
    return reply({ ...note, mode: session.lab.mode });
  }
  return reply({ error: 'Not found' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try { return await api(request, env, url); }
      catch (err) { console.error('Lab request failed', err?.name || 'Error'); return reply({ error: 'Unexpected lab error' }, 500); }
    }
    if (request.method === 'GET' && /^\/notes\/[1-9]\d*$/.test(url.pathname)) {
      return env.ASSETS.fetch(new Request(new URL('/', request.url)));
    }
    return env.ASSETS.fetch(request);
  },
  async scheduled(_event, env) {
    const cutoff = Date.now() - LAB_MAX_AGE * 1000;
    await env.DB.prepare('DELETE FROM labs WHERE created_at < ?').bind(cutoff).run();
  },
};

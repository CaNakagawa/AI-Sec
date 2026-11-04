import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

class FakeD1 {
  constructor() { this.labs = []; this.notes = []; this.nextLab = 1; this.nextNote = 1; }
  prepare(sql) {
    const db = this;
    return { bind(...args) { return {
      async first() {
        if (sql.startsWith('SELECT id, mode FROM labs')) return db.labs.find(x => x.token_hash === args[0] && x.created_at > args[1]) || null;
        if (sql.startsWith('SELECT id FROM notes')) return db.notes.filter(x => x.lab_id === args[0] && x.owner === args[1] && x.is_seed === 1).sort((a,b)=>a.id-b.id)[0] || null;
        if (sql.startsWith('SELECT COUNT(*)')) return { total: db.notes.filter(x => x.lab_id === args[0]).length };
        if (sql.startsWith('SELECT id, owner, body FROM notes')) return db.notes.find(x => x.id === args[0] && x.lab_id === args[1]) || null;
        throw new Error('Unexpected query: '+sql);
      },
      async all() {
        if (sql.startsWith('SELECT id, body FROM notes')) return { results: db.notes.filter(x => x.lab_id === args[0] && x.owner === args[1]).sort((a,b)=>b.id-a.id).map(({id,body})=>({id,body})) };
        throw new Error('Unexpected query: '+sql);
      },
      async run() {
        if (sql.startsWith('INSERT INTO labs')) { const id = db.nextLab++; db.labs.push({id,token_hash:args[0],mode:args[1],created_at:args[2]}); return {meta:{last_row_id:id}}; }
        if (sql.startsWith('INSERT INTO notes')) { const id = db.nextNote++; db.notes.push({id,lab_id:args[0],owner:args[1],body:args[2],is_seed:Number(sql.includes('VALUES (?, ?, ?, 1)'))}); return {meta:{last_row_id:id}}; }
        if (sql.startsWith('UPDATE labs')) { db.labs.find(x=>x.id===args[1]).mode = args[0]; return {success:true}; }
        if (sql.startsWith('DELETE FROM labs')) { const valid = db.labs.filter(x=>x.created_at>=args[0]); db.labs=valid; db.notes=db.notes.filter(n=>valid.some(l=>l.id===n.lab_id)); return {success:true}; }
        throw new Error('Unexpected query: '+sql);
      }
    }; }};
  }
  async batch(statements) { return Promise.all(statements.map(x => x.run())); }
}
const origin = 'https://example.test';
const env = () => ({DB:new FakeD1(),ASSETS:{fetch:()=>new Response('HTML')}});
async function call(e, path, cookie = '', method='GET', body, headers={}) {
  const response = await worker.fetch(new Request(origin + path, {
    method, headers: {...(cookie?{Cookie:cookie}:{}),...(method==='POST'?{'Content-Type':'application/json',Origin:origin}:{}), ...headers},
    ...(body!==undefined?{body:JSON.stringify(body)}:{})
  }), e);
  return { response, data: response.headers.get('content-type')?.includes('json') ? await response.json() : null };
}
const cookie = response => response.headers.get('set-cookie')?.split(';')[0];

test('IDOR is reproducible within the synthetic session, then blocked in protected mode',async()=>{
  const e=env(); const init=await call(e,'/api/session');
  assert.equal(init.response.status,200); assert.equal(init.data.actor,'alex');
  const sid=cookie(init.response), id=init.data.demoNoteId;
  const vuln=await call(e,`/api/notes/${id}`,sid); assert.equal(vuln.response.status,200);
  assert.equal(vuln.data.owner,'sam');
  const toggle=await call(e,'/api/mode',sid,'POST',{mode:'protected'}); assert.equal(toggle.response.status,200);
  const denied=await call(e,`/api/notes/${id}`,sid); assert.equal(denied.response.status,403);
  const own=await call(e,`/api/notes/${init.data.notes[0].id}`,sid); assert.equal(own.response.status,200);
});

test('cross-visitor access is blocked even when demonstration is vulnerable',async()=>{
  const e=env(); const a=await call(e,'/api/session'); const b=await call(e,'/api/session');
  const leak=await call(e,`/api/notes/${a.data.demoNoteId}`,cookie(b.response));
  assert.equal(leak.response.status,404);
});

test('state changes require same-origin JSON and a valid lab cookie',async()=>{
  const e=env(); const init=await call(e,'/api/session');
  const invalid=await call(e,'/api/mode',cookie(init.response),'POST',{mode:'protected'},{Origin:'https://evil.test'});
  assert.equal(invalid.response.status,403);
  const missing=await call(e,'/api/notes', '', 'POST',{text:'demo'}); assert.equal(missing.response.status,401);
});

test('synthetic note creation validates length and enforces a per-lab cap',async()=>{
  const e=env(); const init=await call(e,'/api/session'); const sid=cookie(init.response);
  assert.equal((await call(e,'/api/notes',sid,'POST',{text:'x'.repeat(241)})).response.status,400);
  for(let i=0;i<8;i++) assert.equal((await call(e,'/api/notes',sid,'POST',{text:`Test ${i}`})).response.status,201);
  assert.equal((await call(e,'/api/notes',sid,'POST',{text:'extra'})).response.status,429);
});

test('missing or expired sessions cannot read notes, and scheduled expiry removes labs',async()=>{
  const e=env(); const init=await call(e,'/api/session');
  assert.equal((await call(e,`/api/notes/${init.data.demoNoteId}`)).response.status,401);
  e.DB.labs[0].created_at = Date.now()-3*60*60*1000;
  assert.equal((await call(e,`/api/notes/${init.data.demoNoteId}`,cookie(init.response))).response.status,401);
  await worker.scheduled({},e); assert.equal(e.DB.labs.length,0); assert.equal(e.DB.notes.length,0);
});

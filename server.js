import express from 'express';
const app = express(), KEY = process.env.ELEVENLABS_API_KEY, API = 'https://api.elevenlabs.io/v1';
if (!KEY) console.warn('Missing ELEVENLABS_API_KEY: copy .env.example to .env');
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

// All ElevenLabs calls happen here so the API key never reaches the browser.
async function el(path, { json, headers, ...o } = {}) {
  const r = await fetch(API + path, { ...o, headers: { 'xi-api-key': KEY, ...(json ? { 'content-type': 'application/json' } : {}), ...headers }, body: json ? JSON.stringify(json) : o.body });
  const t = await r.text(); let d; try { d = JSON.parse(t); } catch { d = t; }
  if (!r.ok) throw Object.assign(new Error(typeof d === 'string' ? d : JSON.stringify(d.detail || d)), { status: r.status });
  return d;
}
const route = f => async (q, s) => { try { s.json(await f(q)); } catch (e) { s.status(e.status || 500).json({ error: e.message }); } };

app.get('/api/voices', route(async () => (await el('/voices')).voices.map(v => ({
  id: v.voice_id, n: v.name, tag: v.labels?.use_case || v.labels?.descriptive || 'general', url: v.preview_url }))));

const kbCache = new Map();
async function knowledge(c) {
  if (!c.kb?.trim()) return [];
  if (!kbCache.has(c.kb)) { const d = await el('/convai/knowledge-base/text', { method: 'POST', json: { text: c.kb, name: c.name + ' knowledge' } }); kbCache.set(c.kb, { type: 'text', name: c.name + ' knowledge', id: d.id }); }
  return [kbCache.get(c.kb)];
}
const body = async c => ({ name: c.name, conversation_config: {
  agent: { first_message: c.welcome,language: c.lang.includes('Hindi') ? 'hi' : 'en', prompt: { prompt: c.prompt + (c.lang.includes('Hindi') ? '\nReply in the caller\'s language (English or Hindi).' : ''), knowledge_base: await knowledge(c) } },
  tts: { voice_id: c.voice, model_id: c.lang.includes('Hindi') ? 'eleven_flash_v2_5' : 'eleven_flash_v2' } } });

app.post('/api/agent', route(async q => {
  const { cfg, id } = q.body, b = await body(cfg);
  if (id) { await el('/convai/agents/' + id, { method: 'PATCH', json: b }); return { agent_id: id }; }
  return { agent_id: (await el('/convai/agents/create', { method: 'POST', json: b })).agent_id };
}));
app.get('/api/signed', route(async q => ({ signed_url: (await el('/convai/conversation/get-signed-url?agent_id=' + encodeURIComponent(q.query.agent))).signed_url })));

app.get('/api/conversations', route(async q => {
  const list = await el('/convai/conversations?page_size=20&agent_id=' + encodeURIComponent(q.query.agent));
  const items = await Promise.all((list.conversations || []).map(async c => {
    const d = await el('/convai/conversations/' + c.conversation_id), ok = d.analysis?.call_successful;
    const tr = (d.transcript || []).filter(m => m.message).map(m => [m.role === 'user' ? 'u' : 'a', m.message]);
    const flag = ok === 'failure' || tr.some(m => m[0] === 'u' && /pain|angry|upset|human|manager|complain/i.test(m[1]));
    return { id: c.conversation_id, dur: d.metadata?.call_duration_secs ?? c.call_duration_secs ?? 0, outcome: ok === 'success' ? 'Resolved' : ok === 'failure' ? 'Needs review' : 'Unknown',
      flag, sent: flag ? 'Negative' : 'Neutral', sum: d.analysis?.transcript_summary || 'Summary not ready yet.', tr };
  }));
  return { items };
}));

// Speech to text (Scribe): lets the builder speak their prompt.
app.post('/api/stt', express.raw({ type: '*/*', limit: '10mb' }), route(async q => {
  const f = new FormData(); f.append('model_id', 'scribe_v1'); f.append('file', new Blob([q.body], { type: q.get('content-type') || 'audio/webm' }), 'prompt.webm');
  return { text: (await el('/speech-to-text', { method: 'POST', body: f })).text };
}));

// Optional LLM generation of the agent config; the client falls back to rules on 404/errors.
app.post('/api/generate', route(async q => {
  if (!process.env.ANTHROPIC_API_KEY) throw Object.assign(new Error('LLM not configured'), { status: 404 });
  const sys = `You design voice-agent configs. Reply with JSON only: {"refuse":false,"name":str,"biz":str,"role":str,"goals":[str],"steps":[str],"welcome":str,"kb":str,"tone":str,"lang":"English"|"English + Hindi","handoff":bool,"rules":[str]}. The welcome message must say it is an AI assistant. If the request is a scam, impersonation of a real person, harassment or otherwise deceptive/illegal, reply {"refuse":true,"reason":str}.`;
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1200, system: sys, messages: [{ role: 'user', content: String(q.body.prompt).slice(0, 400) }] }) });
  const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || 'LLM error');
  return JSON.parse(d.content[0].text.replace(/```json|```/g, '').trim());
}));

app.listen(process.env.PORT || 3000, () => console.log('VaaniBuilder on http://localhost:' + (process.env.PORT || 3000)));

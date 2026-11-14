import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, MessageSquare, CheckCheck, ShieldCheck } from 'lucide-react';
import { api, timeAgo } from '../api.js';

function Inbox({ activeId, me }) {
  const [list, setList] = useState(null);
  useEffect(() => {
    let stop = false;
    const load = () => { if (document.visibilityState === 'visible') api.chatList().then((x) => { if (!stop) setList(x); }).catch(() => {}); };
    load();
    const t = setInterval(load, 10000);
    return () => { stop = true; clearInterval(t); };
  }, [activeId]);
  return (
    <div className="overflow-hidden rounded-xl border border-brand/15 bg-white">
      <h1 className="flex items-center gap-2 border-b border-brand/10 p-4 text-lg font-extrabold text-brand-dark"><MessageSquare className="size-5" />Messages</h1>
      {list === null ? <p className="p-4 text-sm">Loading…</p> : list.length === 0 ? (
        <p className="p-4 text-sm text-ink/70">No conversations yet. Open an ad and tap <b>Chat with seller</b>.</p>
      ) : (
        <ul className="max-h-[70vh] divide-y divide-brand/10 overflow-y-auto">
          {list.map((c) => (
            <li key={c.id}>
              <a href={`#/chat/${c.id}`} className={`flex gap-3 p-3 hover:bg-brand-tint ${c.id === activeId ? 'bg-brand-tint' : ''}`}>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand font-bold text-white">{c.other_name[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2"><b className="truncate">{c.other_name}</b><span className="ml-auto shrink-0 text-xs text-ink/60">{timeAgo(c.last_message_at)}</span></span>
                  {c.product_title && <span className="block truncate text-xs text-brand-dark">{c.product_title}</span>}
                  <span className="flex items-center gap-2">
                    <span className={`block flex-1 truncate text-sm ${c.unread ? 'font-bold' : 'text-ink/70'}`}>{c.last_sender === me ? 'You: ' : ''}{c.last_body}</span>
                    {c.unread > 0 && <span className="rounded-full bg-red-600 px-2 text-xs font-bold text-white">{c.unread}</span>}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Thread({ id, user }) {
  const [msgs, setMsgs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [seen, setSeen] = useState(0);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const last = useRef(0);
  const box = useRef(null);

  const load = async () => {
    try {
      const r = await api.chatMessages(id, last.current);
      if (r.conversation) setMeta(r.conversation);
      setSeen(r.seen_up_to);
      if (r.messages.length) {
        last.current = r.messages[r.messages.length - 1].id;
        setMsgs((m) => [...m, ...r.messages.filter((x) => !m.some((y) => y.id === x.id))]);
      }
    } catch (e) { if (/not found/i.test(e.message)) setMissing(true); }
  };
  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 3000);
    return () => clearInterval(t);
  }, [id]);
  useEffect(() => { const el = box.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs.length]);

  async function send(e) {
    e?.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true); setErr('');
    try {
      const m = await api.chatSend(id, body);
      last.current = Math.max(last.current, m.id);
      setMsgs((x) => (x.some((y) => y.id === m.id) ? x : [...x, m]));
      setText('');
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }

  if (missing) return <p className="rounded-xl border border-brand/15 bg-white p-6">Conversation not found. <a href="#/chat" className="text-brand underline">Back to messages</a></p>;
  const lastMine = [...msgs].reverse().find((m) => m.sender_id === user.id);
  const p = meta?.product;
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-brand/15 bg-white">
      <div className="flex items-center gap-3 border-b border-brand/10 p-3">
        <a href="#/chat" aria-label="Back to messages" className="rounded-full p-1 hover:bg-brand-tint md:hidden"><ArrowLeft className="size-5" /></a>
        {meta && <>
          <span className="grid size-10 place-items-center rounded-full bg-brand font-bold text-white">{meta.other.name[0]}</span>
          <a href={`#/seller/${meta.other.id}`} className="font-bold hover:text-brand">{meta.other.name}</a>
        </>}
      </div>
      {p && (
        <a href={`#/product/${p.id}`} className="flex items-center gap-3 border-b border-brand/10 bg-brand-tint p-3 hover:bg-brand/10">
          <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-brand/10">{p.image_url && <img src={p.image_url} alt="" className="size-full object-cover" />}</span>
          <span className="min-w-0"><b className="block truncate">{p.title}</b>
            <span className="text-sm text-brand-dark">{p.price != null ? `KSh ${Number(p.price).toLocaleString()}` : 'Open to swaps'}{p.status === 'SOLD' && ' · Sold'}</span></span>
        </a>
      )}
      <div ref={box} className="h-[50vh] space-y-2 overflow-y-auto bg-white p-3">
        {msgs.length === 0 && <p className="py-10 text-center text-sm text-ink/60">Say hello. Ask if the item is still available and where you can meet on campus.</p>}
        {msgs.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? 'rounded-br-sm bg-brand text-white' : 'rounded-bl-sm border border-brand/15 bg-brand-tint'}`}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${mine ? 'text-white/80' : 'text-ink/60'}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {mine && lastMine?.id === m.id && m.id <= seen && <><CheckCheck className="size-3.5" />Seen</>}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} className="border-t border-brand/10 p-3">
        {err && <p role="alert" className="mb-2 text-sm text-red-700">{err}</p>}
        <div className="flex items-end gap-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={1000} placeholder="Type a message"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-lg border border-brand/30 px-3 py-2" aria-label="Message" />
          <button disabled={busy || !text.trim()} aria-label="Send" className="grid size-11 place-items-center rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-50"><Send className="size-5" /></button>
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-xs text-ink/60"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />Never pay before you see the item. Meet on campus in a public place.</p>
      </form>
    </div>
  );
}

export default function ChatPage({ id, user }) {
  return (
    <section className="py-6">
      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <div className={id ? 'hidden md:block' : ''}><Inbox activeId={id} me={user.id} /></div>
        <div className={!id ? 'hidden md:block' : ''}>
          {id ? <Thread key={id} id={id} user={user} /> : (
            <div className="grid h-full min-h-60 place-items-center rounded-xl border border-brand/15 bg-white p-8 text-center text-ink/70">
              <div><MessageSquare className="mx-auto mb-2 size-10 text-brand" />Choose a conversation, or open an ad and tap <b>Chat with seller</b>.</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY   = "personal-crm-contacts";
const AI_KEY        = "personal-crm-ai-history";
const ACTIONS_KEY   = "personal-crm-actions";

const COLORS = ["c-blue","c-teal","c-purple","c-coral","c-pink","c-amber","c-green"];
function getColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % COLORS.length;
  return COLORS[h];
}
function initials(name) {
  return name.split(" ").slice(0,2).map(w => w[0]||"").join("").toUpperCase() || "?";
}
const COLOR_MAP = {
  "c-blue":   { bg:"#E6F1FB", text:"#0C447C" },
  "c-teal":   { bg:"#E1F5EE", text:"#085041" },
  "c-purple": { bg:"#EEEDFE", text:"#3C3489" },
  "c-coral":  { bg:"#FAECE7", text:"#712B13" },
  "c-pink":   { bg:"#FBEAF0", text:"#72243E" },
  "c-amber":  { bg:"#FAEEDA", text:"#633806" },
  "c-green":  { bg:"#EAF3DE", text:"#27500A" },
};

function Avatar({ name, size = 40 }) {
  const { bg, text } = COLOR_MAP[getColor(name)] || COLOR_MAP["c-blue"];
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg, color:text, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:500, fontSize:size*0.33, flexShrink:0 }}>
      {initials(name)}
    </div>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-NZ", { day:"numeric", month:"short", year:"numeric" });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = new Date(dateStr); due.setHours(0,0,0,0);
  return Math.round((due - today) / 86400000);
}

function DueBadge({ dateStr }) {
  const d = daysUntil(dateStr);
  if (d === null) return null;
  let bg, color, label;
  if      (d < 0)  { bg="#FCEBEB"; color="#A32D2D"; label=`${Math.abs(d)}d overdue`; }
  else if (d === 0){ bg="#FAEEDA"; color="#854F0B"; label="Due today"; }
  else if (d <= 3) { bg="#FAEEDA"; color="#854F0B"; label=`Due in ${d}d`; }
  else             { bg="#E1F5EE"; color="#085041"; label=new Date(dateStr).toLocaleDateString("en-NZ",{day:"numeric",month:"short"}); }
  return <span style={{ fontSize:11, fontWeight:500, padding:"2px 8px", borderRadius:20, background:bg, color, whiteSpace:"nowrap" }}>{label}</span>;
}

const LinkedInIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#185FA5">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

export default function CRM() {
  const [contacts,      setContacts]      = useState([]);
  const [actions,       setActions]       = useState([]);
  const [view,          setView]          = useState("list");
  const [selected,      setSelected]      = useState(null);
  const [detailTab,     setDetailTab]     = useState("notes");
  const [search,        setSearch]        = useState("");
  const [form,          setForm]          = useState({ name:"", company:"", role:"", linkedin:"", notes:"", date: new Date().toISOString().slice(0,10) });
  const [formError,     setFormError]     = useState("");
  const [aiMessages,    setAiMessages]    = useState([]);
  const [aiInput,       setAiInput]       = useState("");
  const [aiLoading,     setAiLoading]     = useState(false);
  const [actionForm,    setActionForm]    = useState({ text:"", contactId:"", dueDate:"" });
  const [actionError,   setActionError]   = useState("");
  const [addingAction,  setAddingAction]  = useState(false);
  const [followUpForm,  setFollowUpForm]  = useState({ text:"", dueDate:"" });
  const [followUpError, setFollowUpError] = useState("");
  const aiEndRef = useRef(null);

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get(STORAGE_KEY); if (r) setContacts(JSON.parse(r.value)); } catch {}
      try { const r = await window.storage.get(AI_KEY);      if (r) setAiMessages(JSON.parse(r.value)); } catch {}
      try { const r = await window.storage.get(ACTIONS_KEY); if (r) setActions(JSON.parse(r.value)); } catch {}
    })();
  }, []);

  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [aiMessages]);

  async function saveContacts(u) { setContacts(u); await window.storage.set(STORAGE_KEY, JSON.stringify(u)); }
  async function saveAiHistory(u){ setAiMessages(u); await window.storage.set(AI_KEY,      JSON.stringify(u)); }
  async function saveActions(u)  { setActions(u);    await window.storage.set(ACTIONS_KEY,  JSON.stringify(u)); }

  function handleExport() {
    const data = { contacts, actions, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `crm-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data.contacts)) { alert("Invalid backup file."); return; }
        await saveContacts(data.contacts);
        await saveActions(data.actions || []);
        alert(`Imported ${data.contacts.length} contacts and ${(data.actions||[]).length} actions.`);
      } catch { alert("Could not read file. Make sure it's a valid CRM backup."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const blankForm = () => ({ name:"", company:"", role:"", linkedin:"", notes:"", date: new Date().toISOString().slice(0,10), actionText:"", actionDueDate:"" });

  function handleAddContact() {
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    const contactId = Date.now();
    saveContacts([{ id:contactId, ...form, name:form.name.trim(), createdAt:new Date().toISOString() }, ...contacts]);
    if (form.actionText.trim()) {
      saveActions([{ id:contactId+1, text:form.actionText.trim(), contactId:String(contactId), dueDate:form.actionDueDate||null, done:false, createdAt:new Date().toISOString() }, ...actions]);
    }
    setForm(blankForm()); setFormError(""); setView("list");
  }

  function handleDeleteContact(id) {
    saveContacts(contacts.filter(c => c.id !== id));
    saveActions(actions.filter(a => a.contactId !== String(id)));
    setView("list"); setSelected(null);
  }

  function handleAddGlobalAction() {
    if (!actionForm.text.trim()) { setActionError("Action text is required."); return; }
    saveActions([{ id:Date.now(), text:actionForm.text.trim(), contactId:actionForm.contactId||null, dueDate:actionForm.dueDate||null, done:false, createdAt:new Date().toISOString() }, ...actions]);
    setActionForm({ text:"", contactId:"", dueDate:"" }); setActionError(""); setAddingAction(false);
  }

  function handleAddFollowUp(contactId) {
    if (!followUpForm.text.trim()) { setFollowUpError("Please enter an action."); return; }
    saveActions([{ id:Date.now(), text:followUpForm.text.trim(), contactId:String(contactId), dueDate:followUpForm.dueDate||null, done:false, createdAt:new Date().toISOString() }, ...actions]);
    setFollowUpForm({ text:"", dueDate:"" }); setFollowUpError("");
  }

  function toggleAction(id) { saveActions(actions.map(a => a.id === id ? { ...a, done:!a.done } : a)); }
  function deleteAction(id) { saveActions(actions.filter(a => a.id !== id)); }

  async function askAI() {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = { role:"user", content:aiInput.trim() };
    const updated = [...aiMessages, userMsg];
    setAiMessages(updated); setAiInput(""); setAiLoading(true);
    const sys = `You are a helpful assistant for a personal CRM. Answer questions concisely. Today is ${new Date().toLocaleDateString("en-NZ")}.

CONTACTS (${contacts.length}):
${contacts.length === 0 ? "None." : contacts.map(c=>`- ${c.name}${c.company?`, ${c.company}`:""}${c.role?`, ${c.role}`:""}${c.date?`, met ${c.date}`:""}${c.notes?`\n  Notes: ${c.notes}`:""}`).join("\n")}

OPEN ACTION ITEMS (${actions.filter(a=>!a.done).length}):
${actions.filter(a=>!a.done).map(a=>`- ${a.text}${a.dueDate?` (due ${a.dueDate})`:""}${a.contactId?` [re: ${contacts.find(c=>String(c.id)===String(a.contactId))?.name||"unknown"}]`:""}`).join("\n")||"None."}`;
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:sys, messages:updated }) });
      const data = await res.json();
      saveAiHistory([...updated, { role:"assistant", content:data.content?.find(b=>b.type==="text")?.text||"Sorry, no response." }]);
    } catch {
      saveAiHistory([...updated, { role:"assistant", content:"Something went wrong. Please try again." }]);
    }
    setAiLoading(false);
  }

  const filtered      = contacts.filter(c => { const q=search.toLowerCase(); return !q||c.name.toLowerCase().includes(q)||(c.company||"").toLowerCase().includes(q)||(c.notes||"").toLowerCase().includes(q); });
  const alertActions  = actions.filter(a => !a.done && a.dueDate && daysUntil(a.dueDate) <= 1);
  const openActions   = actions.filter(a => !a.done);
  const doneActions   = actions.filter(a =>  a.done);

  // ─── Shared styles ───
  const S = {
    page:       { fontFamily:"var(--font-sans)", maxWidth:640, margin:"0 auto", padding:"1.5rem 1rem" },
    topBar:     { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.5rem", gap:8, flexWrap:"wrap" },
    title:      { fontSize:20, fontWeight:500, color:"var(--color-text-primary)", margin:0 },
    btn:        { padding:"7px 16px", borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-secondary)", background:"transparent", color:"var(--color-text-primary)", cursor:"pointer", fontSize:13, fontWeight:500 },
    btnPrimary: { padding:"7px 16px", borderRadius:"var(--border-radius-md)", border:"none", background:"var(--color-text-primary)", color:"var(--color-background-primary)", cursor:"pointer", fontSize:13, fontWeight:500 },
    btnSm:      { padding:"4px 10px", borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-tertiary)", background:"transparent", color:"var(--color-text-tertiary)", cursor:"pointer", fontSize:12 },
    input:      { width:"100%", padding:"8px 12px", borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-secondary)", background:"var(--color-background-primary)", color:"var(--color-text-primary)", fontSize:14, boxSizing:"border-box" },
    label:      { fontSize:12, color:"var(--color-text-secondary)", marginBottom:4, display:"block" },
    card:       { background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"12px 16px", cursor:"pointer", marginBottom:8, display:"flex", alignItems:"center", gap:12, transition:"border-color 0.15s" },
    field:      { marginBottom:16 },
    section:    { fontSize:11, fontWeight:500, color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"20px 0 8px" },
    alert:      { background:"#FAEEDA", border:"0.5px solid #EF9F27", borderRadius:"var(--border-radius-md)", padding:"10px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:8, cursor:"pointer" },
    divider:    { borderTop:"0.5px solid var(--color-border-tertiary)", margin:"16px 0" },
  };

  function NavBtn({ id, label, badge }) {
    const active = view === id;
    return (
      <button onClick={()=>setView(id)} style={{ padding:"6px 14px", borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-secondary)", background:active?"var(--color-background-secondary)":"transparent", color:active?"var(--color-text-primary)":"var(--color-text-secondary)", cursor:"pointer", fontSize:13, fontWeight:active?500:400, display:"flex", alignItems:"center", gap:5 }}>
        {label}
        {badge > 0 && <span style={{ background:"#E24B4A", color:"#fff", borderRadius:10, fontSize:10, fontWeight:500, padding:"0 5px", minWidth:16, textAlign:"center", lineHeight:"16px" }}>{badge}</span>}
      </button>
    );
  }

  // ── ADD CONTACT ──────────────────────────────────────────
  if (view === "add") return (
    <div style={S.page}>
      <div style={S.topBar}>
        <p style={S.title}>Add contact</p>
        <button style={S.btn} onClick={() => { setView("list"); setFormError(""); }}>← Back</button>
      </div>
      <div style={S.field}><label style={S.label}>Name *</label><input style={S.input} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Jane Smith" /></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <div><label style={S.label}>Company</label><input style={S.input} value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="Acme Corp" /></div>
        <div><label style={S.label}>Role</label><input style={S.input} value={form.role} onChange={e=>setForm({...form,role:e.target.value})} placeholder="CTO" /></div>
      </div>
      <div style={S.field}><label style={S.label}>LinkedIn URL (optional)</label><input style={S.input} value={form.linkedin} onChange={e=>setForm({...form,linkedin:e.target.value})} placeholder="https://linkedin.com/in/janesmith" /></div>
      <div style={S.field}><label style={S.label}>Date met</label><input type="date" style={S.input} value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
      <div style={S.field}><label style={S.label}>Meeting notes</label><textarea style={{...S.input,height:120,resize:"vertical"}} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Discussed AI strategy, building LLM products…" /></div>
      <div style={{borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:16,marginBottom:16}}>
        <p style={{...S.label,marginBottom:8,fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>Action item <span style={{fontWeight:400,color:"var(--color-text-secondary)"}}>(optional)</span></p>
        <div style={S.field}><input style={S.input} value={form.actionText} onChange={e=>setForm({...form,actionText:e.target.value})} placeholder="Send intro email, share deck, follow up on…" /></div>
        <div><label style={S.label}>Due date</label><input type="date" style={S.input} value={form.actionDueDate} onChange={e=>setForm({...form,actionDueDate:e.target.value})} /></div>
      </div>
      {formError && <p style={{color:"var(--color-text-danger)",fontSize:13,marginBottom:12}}>{formError}</p>}
      <button style={S.btnPrimary} onClick={handleAddContact}>Save contact</button>
    </div>
  );

  // ── CONTACT DETAIL ───────────────────────────────────────
  if (view === "detail" && selected) {
    const c = selected;
    const allContactActions  = actions.filter(a => String(a.contactId) === String(c.id));
    const openContactActions = allContactActions.filter(a => !a.done);
    const doneContactActions = allContactActions.filter(a =>  a.done);
    const urgentCount        = openContactActions.filter(a => a.dueDate && daysUntil(a.dueDate) <= 1).length;
    const linkedinHref       = c.linkedin ? (c.linkedin.startsWith("http") ? c.linkedin : `https://${c.linkedin}`) : null;

    const TabBtn = ({ id, label, badge }) => (
      <button
        onClick={() => { setDetailTab(id); setFollowUpError(""); }}
        style={{
          padding:"7px 18px", borderRadius:"var(--border-radius-md)",
          border: detailTab === id ? "0.5px solid var(--color-border-primary)" : "0.5px solid var(--color-border-secondary)",
          background: detailTab === id ? "var(--color-background-primary)" : "transparent",
          color: detailTab === id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
          cursor:"pointer", fontSize:13, fontWeight: detailTab === id ? 500 : 400,
          display:"flex", alignItems:"center", gap:6,
        }}
      >
        {label}
        {badge > 0 && (
          <span style={{ background:"#E24B4A", color:"#fff", borderRadius:10, fontSize:10, fontWeight:500, padding:"0 5px", minWidth:16, textAlign:"center", lineHeight:"16px" }}>
            {badge}
          </span>
        )}
      </button>
    );

    return (
      <div style={S.page}>
        {/* Top bar */}
        <div style={S.topBar}>
          <button style={S.btn} onClick={() => { setView("list"); setDetailTab("notes"); setFollowUpForm({text:"",dueDate:""}); setFollowUpError(""); }}>
            ← Back
          </button>
          <button style={{...S.btn, color:"var(--color-text-danger)"}} onClick={() => handleDeleteContact(c.id)}>Delete</button>
        </div>

        {/* Contact header */}
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
          <Avatar name={c.name} size={52} />
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:0, fontSize:18, fontWeight:500, color:"var(--color-text-primary)" }}>{c.name}</p>
            {(c.role||c.company) && (
              <p style={{ margin:0, fontSize:13, color:"var(--color-text-secondary)" }}>
                {[c.role, c.company].filter(Boolean).join(" · ")}
              </p>
            )}
            {linkedinHref && (
              <a href={linkedinHref} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:12, color:"#185FA5", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:4, marginTop:4 }}>
                <LinkedInIcon /> LinkedIn
              </a>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display:"flex", gap:8, borderBottom:"0.5px solid var(--color-border-tertiary)", paddingBottom:12, marginBottom:20 }}>
          <TabBtn id="notes"    label="Notes"     badge={0} />
          <TabBtn id="followup" label="Follow-up" badge={urgentCount} />
        </div>

        {/* ── NOTES TAB ── */}
        {detailTab === "notes" && (
          <div>
            {c.date && (
              <div style={{ marginBottom:14 }}>
                <p style={S.label}>Date met</p>
                <p style={{ margin:0, fontSize:14, color:"var(--color-text-primary)" }}>{c.date}</p>
              </div>
            )}
            {c.notes
              ? <div><p style={S.label}>Notes</p><p style={{ margin:0, fontSize:14, color:"var(--color-text-primary)", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{c.notes}</p></div>
              : <p style={{ color:"var(--color-text-secondary)", fontSize:13 }}>No notes recorded.</p>
            }
            <p style={{ fontSize:11, color:"var(--color-text-tertiary)", marginTop:24 }}>Added {formatDate(c.createdAt)}</p>
          </div>
        )}

        {/* ── FOLLOW-UP TAB ── */}
        {detailTab === "followup" && (
          <div>
            {/* Quick-add */}
            <div style={{ background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"14px 16px", marginBottom:20 }}>
              <p style={{ ...S.label, fontWeight:500, marginBottom:10 }}>Add follow-up</p>
              <div style={S.field}>
                <input
                  style={S.input}
                  value={followUpForm.text}
                  onChange={e => setFollowUpForm({ ...followUpForm, text:e.target.value })}
                  placeholder="Send intro email, share deck, check in…"
                  onKeyDown={e => e.key === "Enter" && handleAddFollowUp(c.id)}
                />
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <div style={{ flex:1 }}>
                  <label style={S.label}>Due date (optional)</label>
                  <input type="date" style={S.input} value={followUpForm.dueDate} onChange={e => setFollowUpForm({ ...followUpForm, dueDate:e.target.value })} />
                </div>
                <button style={{ ...S.btnPrimary, alignSelf:"flex-end" }} onClick={() => handleAddFollowUp(c.id)}>Add</button>
              </div>
              {followUpError && <p style={{ fontSize:12, color:"var(--color-text-danger)", marginTop:8 }}>{followUpError}</p>}
            </div>

            {/* Open items */}
            {openContactActions.length === 0 && (
              <p style={{ fontSize:13, color:"var(--color-text-secondary)" }}>No open follow-ups — add one above.</p>
            )}
            {openContactActions.length > 0 && (
              <>
                <p style={S.section}>Open · {openContactActions.length}</p>
                {openContactActions.map(a => (
                  <div key={a.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
                    <input type="checkbox" checked={false} onChange={() => toggleAction(a.id)} style={{ width:15, height:15, cursor:"pointer", flexShrink:0 }} />
                    <span style={{ flex:1, fontSize:13, color:"var(--color-text-primary)" }}>{a.text}</span>
                    {a.dueDate && <DueBadge dateStr={a.dueDate} />}
                    <button style={S.btnSm} onClick={() => deleteAction(a.id)}>✕</button>
                  </div>
                ))}
              </>
            )}

            {/* Done items */}
            {doneContactActions.length > 0 && (
              <>
                <p style={S.section}>Done · {doneContactActions.length}</p>
                {doneContactActions.map(a => (
                  <div key={a.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"0.5px solid var(--color-border-tertiary)", opacity:0.55 }}>
                    <input type="checkbox" checked={true} onChange={() => toggleAction(a.id)} style={{ width:15, height:15, cursor:"pointer", flexShrink:0 }} />
                    <span style={{ flex:1, fontSize:13, color:"var(--color-text-secondary)", textDecoration:"line-through" }}>{a.text}</span>
                    <button style={S.btnSm} onClick={() => deleteAction(a.id)}>✕</button>
                  </div>
                ))}
              </>
            )}

            {/* Link to global actions */}
            <div style={{ marginTop:24, paddingTop:16, borderTop:"0.5px solid var(--color-border-tertiary)" }}>
              <button
                onClick={() => { setView("actions"); setDetailTab("notes"); }}
                style={{ ...S.btn, fontSize:12, color:"var(--color-text-secondary)" }}
              >
                View all action items →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── ASK AI ───────────────────────────────────────────────
  if (view === "ask") return (
    <div style={{ ...S.page, display:"flex", flexDirection:"column", minHeight:500 }}>
      <div style={S.topBar}>
        <p style={S.title}>Ask about your network</p>
        <div style={{ display:"flex", gap:8 }}>
          {aiMessages.length > 0 && <button style={S.btn} onClick={() => saveAiHistory([])}>Clear</button>}
          <button style={S.btn} onClick={() => setView("list")}>← Back</button>
        </div>
      </div>
      {contacts.length === 0 && <p style={{ fontSize:13, color:"var(--color-text-secondary)" }}>Add some contacts first.</p>}
      <div style={{ flex:1, overflowY:"auto", marginBottom:16, display:"flex", flexDirection:"column", gap:12 }}>
        {aiMessages.length === 0 && contacts.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:8 }}>
            {["Who has experience in AI?","Who works at a startup?","What are my open action items?","Summarise my network"].map(q => (
              <button key={q} style={{ ...S.btn, fontSize:12 }} onClick={() => { setAiInput(q); setTimeout(() => document.getElementById("ai-send")?.click(), 50); }}>{q}</button>
            ))}
          </div>
        )}
        {aiMessages.map((m,i) => (
          <div key={i} style={{ alignSelf:m.role==="user"?"flex-end":"flex-start", maxWidth:"85%", background:m.role==="user"?"var(--color-background-secondary)":"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"10px 14px", fontSize:14, lineHeight:1.6, color:"var(--color-text-primary)", whiteSpace:"pre-wrap" }}>{m.content}</div>
        ))}
        {aiLoading && <div style={{ alignSelf:"flex-start", fontSize:13, color:"var(--color-text-secondary)", padding:"8px 0" }}>Thinking…</div>}
        <div ref={aiEndRef} />
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <input style={{ ...S.input, flex:1 }} value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Who in my network has built AI products?" onKeyDown={e => e.key==="Enter" && askAI()} />
        <button id="ai-send" style={S.btnPrimary} onClick={askAI} disabled={aiLoading}>Ask</button>
      </div>
    </div>
  );

  // ── ACTIONS VIEW ─────────────────────────────────────────
  if (view === "actions") return (
    <div style={S.page}>
      <div style={S.topBar}>
        <p style={S.title}>Action items</p>
        <div style={{ display:"flex", gap:8 }}>
          <button style={S.btn} onClick={() => setView("list")}>← Back</button>
          <button style={S.btnPrimary} onClick={() => setAddingAction(true)}>+ Add</button>
        </div>
      </div>

      {alertActions.length > 0 && (
        <div style={S.alert}>
          <span style={{ fontSize:15 }}>⚠</span>
          <span style={{ fontSize:13, color:"#633806", fontWeight:500 }}>{alertActions.length} item{alertActions.length>1?"s":""} overdue or due today</span>
        </div>
      )}

      {addingAction && (
        <div style={{ background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-secondary)", borderRadius:"var(--border-radius-lg)", padding:"14px 16px", marginBottom:16 }}>
          <div style={S.field}><label style={S.label}>Action *</label><input style={S.input} value={actionForm.text} onChange={e=>setActionForm({...actionForm,text:e.target.value})} placeholder="Follow up with Jane about the partnership deck" autoFocus /></div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div><label style={S.label}>Link to contact (optional)</label>
              <select style={S.input} value={actionForm.contactId} onChange={e=>setActionForm({...actionForm,contactId:e.target.value})}>
                <option value="">No contact</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label style={S.label}>Due date (optional)</label><input type="date" style={S.input} value={actionForm.dueDate} onChange={e=>setActionForm({...actionForm,dueDate:e.target.value})} /></div>
          </div>
          {actionError && <p style={{ fontSize:12, color:"var(--color-text-danger)", marginBottom:8 }}>{actionError}</p>}
          <div style={{ display:"flex", gap:8 }}>
            <button style={S.btnPrimary} onClick={handleAddGlobalAction}>Save</button>
            <button style={S.btn} onClick={() => { setAddingAction(false); setActionError(""); }}>Cancel</button>
          </div>
        </div>
      )}

      {openActions.length === 0 && !addingAction && (
        <div style={{ textAlign:"center", padding:"2.5rem 1rem", color:"var(--color-text-secondary)" }}>
          <p style={{ fontSize:14, marginBottom:12 }}>No open action items.</p>
          <button style={S.btnPrimary} onClick={() => setAddingAction(true)}>+ Add one</button>
        </div>
      )}

      {openActions.length > 0 && (
        <>
          <p style={S.section}>Open · {openActions.length}</p>
          {openActions.map(a => {
            const linked = a.contactId ? contacts.find(c => String(c.id) === String(a.contactId)) : null;
            return (
              <div key={a.id} style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", padding:"10px 14px", marginBottom:8, display:"flex", alignItems:"flex-start", gap:10 }}>
                <input type="checkbox" checked={false} onChange={() => toggleAction(a.id)} style={{ width:15, height:15, cursor:"pointer", flexShrink:0, marginTop:2 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:13, color:"var(--color-text-primary)", lineHeight:1.5 }}>{a.text}</p>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:5, flexWrap:"wrap" }}>
                    {linked && (
                      <span onClick={() => { setSelected(linked); setDetailTab("followup"); setView("detail"); }} style={{ fontSize:11, color:"#185FA5", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                        <Avatar name={linked.name} size={14} /> {linked.name}
                      </span>
                    )}
                    {a.dueDate && <DueBadge dateStr={a.dueDate} />}
                  </div>
                </div>
                <button style={S.btnSm} onClick={() => deleteAction(a.id)}>✕</button>
              </div>
            );
          })}
        </>
      )}

      {doneActions.length > 0 && (
        <>
          <p style={S.section}>Done · {doneActions.length}</p>
          {doneActions.map(a => (
            <div key={a.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"0.5px solid var(--color-border-tertiary)", opacity:0.55 }}>
              <input type="checkbox" checked={true} onChange={() => toggleAction(a.id)} style={{ width:15, height:15, cursor:"pointer", flexShrink:0 }} />
              <span style={{ flex:1, fontSize:13, color:"var(--color-text-secondary)", textDecoration:"line-through" }}>{a.text}</span>
              <button style={S.btnSm} onClick={() => deleteAction(a.id)}>✕</button>
            </div>
          ))}
        </>
      )}
    </div>
  );

  // ── CONTACTS LIST ────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.topBar}>
        <p style={S.title}>My network <span style={{ fontWeight:400, fontSize:14, color:"var(--color-text-secondary)" }}>{contacts.length > 0 ? `· ${contacts.length}` : ""}</span></p>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <NavBtn id="actions" label="Actions" badge={alertActions.length} />
          <NavBtn id="ask"     label="Ask AI ✦" badge={0} />
          <button style={S.btnPrimary} onClick={() => setView("add")}>+ Add</button>
        </div>
      </div>

      {alertActions.length > 0 && (
        <div onClick={() => setView("actions")} style={S.alert}>
          <span style={{ fontSize:15 }}>⚠</span>
          <span style={{ fontSize:13, color:"#633806" }}>{alertActions.length} action item{alertActions.length>1?"s":""} need your attention</span>
          <span style={{ marginLeft:"auto", fontSize:12, color:"#854F0B" }}>View →</span>
        </div>
      )}

      {contacts.length > 0 && (
        <div style={{ marginTop:24, paddingTop:16, borderTop:"0.5px solid var(--color-border-tertiary)", display:"flex", gap:8, alignItems:"center" }}>
          <button style={S.btn} onClick={handleExport}>Export backup</button>
          <label style={{ ...S.btn, cursor:"pointer" }}>
            Import backup
            <input type="file" accept=".json" onChange={handleImport} style={{ display:"none" }} />
          </label>
          <span style={{ fontSize:11, color:"var(--color-text-tertiary)", marginLeft:4 }}>Save a backup after each session to keep your data</span>
        </div>
      )}

      {contacts.length > 0 && (
        <input style={{ ...S.input, marginBottom:16, marginTop:12 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, company, or notes…" />
      )}

      {contacts.length === 0 ? (
        <div style={{ textAlign:"center", padding:"3rem 1rem", color:"var(--color-text-secondary)" }}>
          <p style={{ fontSize:14 }}>No contacts yet.</p>
          <button style={S.btnPrimary} onClick={() => setView("add")}>Add your first contact</button>
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ fontSize:13, color:"var(--color-text-secondary)" }}>No contacts match your search.</p>
      ) : (
        filtered.map(c => {
          const cActions = actions.filter(a => String(a.contactId) === String(c.id) && !a.done);
          const urgent   = cActions.filter(a => a.dueDate && daysUntil(a.dueDate) <= 1);
          return (
            <div key={c.id} style={S.card}
              onClick={() => { setSelected(c); setDetailTab("notes"); setView("detail"); }}
              onMouseEnter={e => e.currentTarget.style.borderColor="var(--color-border-secondary)"}
              onMouseLeave={e => e.currentTarget.style.borderColor="var(--color-border-tertiary)"}
            >
              <Avatar name={c.name} size={40} />
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontSize:14, fontWeight:500, color:"var(--color-text-primary)" }}>{c.name}</p>
                {(c.role||c.company) && <p style={{ margin:0, fontSize:12, color:"var(--color-text-secondary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{[c.role,c.company].filter(Boolean).join(" · ")}</p>}
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                {urgent.length > 0 && <span style={{ background:"#FCEBEB", color:"#A32D2D", fontSize:10, fontWeight:500, padding:"2px 7px", borderRadius:10 }}>{urgent.length} due</span>}
                {cActions.length > 0 && urgent.length === 0 && <span style={{ background:"var(--color-background-secondary)", color:"var(--color-text-secondary)", fontSize:10, padding:"2px 7px", borderRadius:10 }}>{cActions.length} open</span>}
                {c.date && <span style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>{c.date}</span>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

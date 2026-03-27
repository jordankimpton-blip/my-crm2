"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";
import { daysUntil } from "@/lib/dates";
import type { Contact, Action } from "./types";
import { ContactList } from "./ContactList";
import { ContactForm } from "./ContactForm";
import { ContactDetail } from "./ContactDetail";
import { ActionsView } from "./ActionsView";
import { AskAIView } from "./AskAIView";

export default function CRM() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", company: "", role: "", linkedin: "", notes: "", date: new Date().toISOString().slice(0, 10), actionText: "", actionDueDate: "" });
  const [formError, setFormError] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: string; content: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: a }] = await Promise.all([
        supabase.from("contacts").select("*").order("created_at", { ascending: false }),
        supabase.from("actions").select("*").order("created_at", { ascending: false }),
      ]);
      if (c) setContacts(c);
      if (a) setActions(a);
      setLoading(false);
    }
    load();
  }, []);

  // CRUD helpers
  async function addContact(data: Omit<Contact, "id" | "created_at">) {
    const { data: row, error } = await supabase.from("contacts").insert(data).select().single();
    if (error) throw new Error(error.message);
    if (row) setContacts(prev => [row, ...prev]);
    return row as Contact | null;
  }

  async function deleteContact(id: number) {
    await supabase.from("contacts").delete().eq("id", id);
    setContacts(prev => prev.filter(c => c.id !== id));
    setActions(prev => prev.filter(a => a.contact_id !== id));
  }

  async function addAction(data: Omit<Action, "id" | "created_at">) {
    const { data: row } = await supabase.from("actions").insert(data).select().single();
    if (row) setActions(prev => [row, ...prev]);
  }

  async function toggleAction(id: number) {
    const action = actions.find(a => a.id === id);
    if (!action) return;
    const { data: row } = await supabase.from("actions").update({ done: !action.done }).eq("id", id).select().single();
    if (row) setActions(prev => prev.map(a => a.id === id ? row : a));
  }

  async function deleteAction(id: number) {
    await supabase.from("actions").delete().eq("id", id);
    setActions(prev => prev.filter(a => a.id !== id));
  }

  // Handlers
  const blankForm = () => ({ name: "", company: "", role: "", linkedin: "", notes: "", date: new Date().toISOString().slice(0, 10), actionText: "", actionDueDate: "" });

  async function handleAddContact() {
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    try {
      const contact = await addContact({ name: form.name.trim(), company: form.company || null, role: form.role || null, linkedin: form.linkedin || null, notes: form.notes || null, date: form.date || null });
      if (contact && form.actionText.trim()) {
        await addAction({ text: form.actionText.trim(), contact_id: contact.id, due_date: form.actionDueDate || null, done: false });
      }
      setForm(blankForm()); setFormError(""); setView("list");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to save contact.");
    }
  }

  async function handleDeleteContact(id: number) {
    await deleteContact(id);
    setView("list"); setSelected(null);
  }

  async function handleAddGlobalAction(text: string, contactId: string, dueDate: string) {
    await addAction({ text, contact_id: contactId ? Number(contactId) : null, due_date: dueDate || null, done: false });
  }

  async function handleAddFollowUp(contactId: number, text: string, dueDate: string) {
    await addAction({ text, contact_id: contactId, due_date: dueDate || null, done: false });
  }

  function handleExport() {
    const data = { contacts, actions, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `crm-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(data.contacts)) { alert("Invalid backup file."); return; }
        for (const c of data.contacts) {
          const { id, created_at, ...rest } = c;
          await supabase.from("contacts").insert({ ...rest, created_at: created_at || new Date().toISOString() });
        }
        const [{ data: nc }, { data: na }] = await Promise.all([
          supabase.from("contacts").select("*").order("created_at", { ascending: false }),
          supabase.from("actions").select("*").order("created_at", { ascending: false }),
        ]);
        if (nc) setContacts(nc);
        if (na) setActions(na);
        alert(`Imported ${data.contacts.length} contacts.`);
      } catch { alert("Could not read file."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function askAI() {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = { role: "user", content: aiInput.trim() };
    const updated = [...aiMessages, userMsg];
    setAiMessages(updated); setAiInput(""); setAiLoading(true);
    const sys = `You are a helpful assistant for a personal CRM. Answer questions concisely. Today is ${new Date().toLocaleDateString("en-NZ")}.
CONTACTS (${contacts.length}):
${contacts.length === 0 ? "None." : contacts.map(c => `- ${c.name}${c.company ? `, ${c.company}` : ""}${c.role ? `, ${c.role}` : ""}${c.date ? `, met ${c.date}` : ""}${c.notes ? `\n  Notes: ${c.notes}` : ""}`).join("\n")}
OPEN ACTION ITEMS (${actions.filter(a => !a.done).length}):
${actions.filter(a => !a.done).map(a => `- ${a.text}${a.due_date ? ` (due ${a.due_date})` : ""}${a.contact_id ? ` [re: ${contacts.find(c => c.id === a.contact_id)?.name || "unknown"}]` : ""}`).join("\n") || "None."}`;
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system: sys, messages: updated }) });
      const data = await res.json();
      setAiMessages([...updated, { role: "assistant", content: data.content?.find((b: { type: string; text?: string }) => b.type === "text")?.text || data.error?.message || "Sorry, no response." }]);
    } catch {
      setAiMessages([...updated, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setAiLoading(false);
  }

  const alertActions = actions.filter(a => !a.done && a.due_date && (daysUntil(a.due_date) ?? 99) <= 1);

  if (loading) return <div className="max-w-2xl mx-auto p-6 text-center text-muted-foreground pt-12">Loading...</div>;

  if (view === "add") return (
    <ContactForm
      form={form}
      formError={formError}
      setForm={setForm}
      onSave={handleAddContact}
      onBack={() => { setView("list"); setFormError(""); }}
    />
  );

  if (view === "detail" && selected) return (
    <ContactDetail
      contact={selected}
      actions={actions}
      onBack={() => { setView("list"); setSelected(null); }}
      onDelete={handleDeleteContact}
      onToggleAction={toggleAction}
      onDeleteAction={deleteAction}
      onAddFollowUp={handleAddFollowUp}
      onNavigateActions={() => setView("actions")}
    />
  );

  if (view === "ask") return (
    <AskAIView
      contacts={contacts}
      aiMessages={aiMessages}
      aiInput={aiInput}
      aiLoading={aiLoading}
      setAiInput={setAiInput}
      setAiMessages={setAiMessages}
      onAsk={askAI}
      onBack={() => setView("list")}
    />
  );

  if (view === "actions") return (
    <ActionsView
      contacts={contacts}
      actions={actions}
      onBack={() => setView("list")}
      onToggleAction={toggleAction}
      onDeleteAction={deleteAction}
      onAddAction={handleAddGlobalAction}
      onSelectContact={c => { setSelected(c); setView("detail"); }}
    />
  );

  return (
    <ContactList
      contacts={contacts}
      actions={actions}
      search={search}
      setSearch={setSearch}
      alertActions={alertActions}
      onSelectContact={c => { setSelected(c); setView("detail"); }}
      onNavigate={setView}
      onExport={handleExport}
      onImport={handleImport}
    />
  );
}

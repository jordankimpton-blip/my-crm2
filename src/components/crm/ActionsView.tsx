"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar } from "./Avatar";
import { DueBadge } from "./DueBadge";
import { daysUntil } from "@/lib/dates";
import type { Contact, Action } from "./types";
import { TriangleAlert } from "lucide-react";

interface ActionsViewProps {
  contacts: Contact[];
  actions: Action[];
  onBack: () => void;
  onToggleAction: (id: number) => void;
  onDeleteAction: (id: number) => void;
  onAddAction: (text: string, contactId: string, dueDate: string) => void;
  onSelectContact: (c: Contact) => void;
}

export function ActionsView({ contacts, actions, onBack, onToggleAction, onDeleteAction, onAddAction, onSelectContact }: ActionsViewProps) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [contactId, setContactId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  const alertActions = actions.filter(a => !a.done && a.due_date && (daysUntil(a.due_date) ?? 99) <= 1);
  const openActions = actions.filter(a => !a.done);
  const doneActions = actions.filter(a => a.done);

  function handleAdd() {
    if (!text.trim()) { setError("Action text is required."); return; }
    onAddAction(text.trim(), contactId, dueDate);
    setText(""); setContactId(""); setDueDate(""); setError(""); setAdding(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium">Action items</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>← Back</Button>
          <Button size="sm" onClick={() => setAdding(true)}>+ Add</Button>
        </div>
      </div>

      {alertActions.length > 0 && (
        <div className="flex items-center gap-2 bg-warning text-warning-foreground rounded-lg px-3.5 py-2.5 mb-4 text-sm font-medium">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          {alertActions.length} item{alertActions.length > 1 ? "s" : ""} overdue or due today
        </div>
      )}

      {adding && (
        <Card className="p-4 mb-4 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Action *</Label>
            <Input value={text} onChange={e => setText(e.target.value)} placeholder="Follow up with Jane about the partnership deck" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Link to contact (optional)</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={contactId} onChange={e => setContactId(e.target.value)}>
                <option value="">No contact</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Due date (optional)</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Save</Button>
            <Button variant="outline" size="sm" onClick={() => { setAdding(false); setError(""); }}>Cancel</Button>
          </div>
        </Card>
      )}

      {openActions.length === 0 && !adding && (
        <div className="text-center py-10 text-muted-foreground">
          <p className="text-sm mb-3">No open action items.</p>
          <Button onClick={() => setAdding(true)}>+ Add one</Button>
        </div>
      )}

      {openActions.length > 0 && (
        <>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-5">Open · {openActions.length}</p>
          <div className="space-y-2">
            {openActions.map(a => {
              const linked = a.contact_id ? contacts.find(c => c.id === a.contact_id) : null;
              return (
                <Card key={a.id} className="flex items-start gap-2.5 p-3">
                  <Checkbox checked={false} onCheckedChange={() => onToggleAction(a.id)} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">{a.text}</p>
                    <div className="flex gap-2 items-center mt-1.5 flex-wrap">
                      {linked && (
                        <span onClick={() => onSelectContact(linked)} className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer flex items-center gap-1">
                          <Avatar name={linked.name} size={14} /> {linked.name}
                        </span>
                      )}
                      {a.due_date && <DueBadge dateStr={a.due_date} />}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground shrink-0" onClick={() => onDeleteAction(a.id)}>✕</Button>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {doneActions.length > 0 && (
        <>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-5">Done · {doneActions.length}</p>
          {doneActions.map(a => (
            <div key={a.id} className="flex items-center gap-2.5 py-2 border-b opacity-50">
              <Checkbox checked={true} onCheckedChange={() => onToggleAction(a.id)} />
              <span className="flex-1 text-sm text-muted-foreground line-through">{a.text}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => onDeleteAction(a.id)}>✕</Button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}


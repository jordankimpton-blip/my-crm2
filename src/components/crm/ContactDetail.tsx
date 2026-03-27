"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "./Avatar";
import { DueBadge } from "./DueBadge";
import { LinkedInLink } from "./LinkedInIcon";
import { formatDate, daysUntil } from "@/lib/dates";
import type { Contact, Action } from "./types";

interface ContactDetailProps {
  contact: Contact;
  actions: Action[];
  onBack: () => void;
  onDelete: (id: number) => void;
  onToggleAction: (id: number) => void;
  onDeleteAction: (id: number) => void;
  onAddFollowUp: (contactId: number, text: string, dueDate: string) => void;
  onNavigateActions: () => void;
}

export function ContactDetail({ contact: c, actions, onBack, onDelete, onToggleAction, onDeleteAction, onAddFollowUp, onNavigateActions }: ContactDetailProps) {
  const [tab, setTab] = useState<"notes" | "followup">("notes");
  const [followText, setFollowText] = useState("");
  const [followDate, setFollowDate] = useState("");
  const [followError, setFollowError] = useState("");

  const allContactActions = actions.filter(a => a.contact_id === c.id);
  const openActions = allContactActions.filter(a => !a.done);
  const doneActions = allContactActions.filter(a => a.done);
  const urgentCount = openActions.filter(a => a.due_date && (daysUntil(a.due_date) ?? 99) <= 1).length;
  const linkedinHref = c.linkedin ? ((c.linkedin as string).startsWith("http") ? c.linkedin : "https://" + c.linkedin) : undefined;

  function handleAddFollowUp() {
    if (!followText.trim()) { setFollowError("Please enter an action."); return; }
    onAddFollowUp(c.id, followText.trim(), followDate);
    setFollowText(""); setFollowDate(""); setFollowError("");
  }

  return (
    <div className="max-w-2xl mx-auto p-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="sm" onClick={onBack}>← Back</Button>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(c.id)}>Delete</Button>
      </div>

      {/* Contact header */}
      <div className="flex items-center gap-3.5 mb-5">
        <Avatar name={c.name} size={52} />
        <div className="flex-1 min-w-0">
          <p className="text-lg font-medium">{c.name}</p>
          {(c.role || c.company) && <p className="text-sm text-muted-foreground">{[c.role, c.company].filter(Boolean).join(" · ")}</p>}
          {linkedinHref && <LinkedInLink href={linkedinHref} />}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-3 mb-5">
        <Button variant={tab === "notes" ? "secondary" : "ghost"} size="sm" onClick={() => setTab("notes")}>Notes</Button>
        <Button variant={tab === "followup" ? "secondary" : "ghost"} size="sm" onClick={() => { setTab("followup"); setFollowError(""); }} className="gap-1.5">
          Follow-up
          {urgentCount > 0 && <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">{urgentCount}</Badge>}
        </Button>
      </div>

      {/* Notes tab */}
      {tab === "notes" && (
        <div className="space-y-3">
          {c.date && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Date met</p>
              <p className="text-sm">{c.date}</p>
            </div>
          )}
          {c.notes ? (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.notes}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No notes recorded.</p>
          )}
          <p className="text-xs text-muted-foreground/60 pt-6">Added {formatDate(c.created_at)}</p>
        </div>
      )}

      {/* Follow-up tab */}
      {tab === "followup" && (
        <div>
          {/* Add follow-up form */}
          <div className="bg-muted/50 border rounded-xl p-4 mb-5">
            <p className="text-xs font-medium mb-2.5">Add follow-up</p>
            <Input
              className="mb-3"
              value={followText}
              onChange={e => setFollowText(e.target.value)}
              placeholder="Send intro email, share deck..."
              onKeyDown={e => e.key === "Enter" && handleAddFollowUp()}
            />
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1.5">Due date (optional)</p>
                <Input type="date" value={followDate} onChange={e => setFollowDate(e.target.value)} />
              </div>
              <Button size="sm" onClick={handleAddFollowUp}>Add</Button>
            </div>
            {followError && <p className="text-xs text-destructive mt-2">{followError}</p>}
          </div>

          {/* Open items */}
          {openActions.length === 0 && <p className="text-sm text-muted-foreground">No open follow-ups — add one above.</p>}
          {openActions.length > 0 && (
            <>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-5">Open · {openActions.length}</p>
              {openActions.map(a => (
                <div key={a.id} className="flex items-center gap-2.5 py-2.5 border-b">
                  <Checkbox checked={false} onCheckedChange={() => onToggleAction(a.id)} />
                  <span className="flex-1 text-sm">{a.text}</span>
                  {a.due_date && <DueBadge dateStr={a.due_date} />}
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => onDeleteAction(a.id)}>✕</Button>
                </div>
              ))}
            </>
          )}

          {/* Done items */}
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

          <Separator className="my-6" />
          <Button variant="ghost" size="sm" className="text-muted-foreground text-xs" onClick={onNavigateActions}>
            View all action items →
          </Button>
        </div>
      )}
    </div>
  );
}

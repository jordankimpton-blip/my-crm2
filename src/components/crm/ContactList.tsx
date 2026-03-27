"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar } from "./Avatar";
import { daysUntil } from "@/lib/dates";
import type { Contact, Action } from "./types";
import { TriangleAlert, Download, Upload } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface ContactListProps {
  contacts: Contact[];
  actions: Action[];
  search: string;
  setSearch: (s: string) => void;
  alertActions: Action[];
  onSelectContact: (c: Contact) => void;
  onNavigate: (view: string) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ContactList({ contacts, actions, search, setSearch, alertActions, onSelectContact, onNavigate, onExport, onImport }: ContactListProps) {
  const q = search.toLowerCase();
  const filtered = contacts.filter(c => !q || c.name.toLowerCase().includes(q) || (c.company || "").toLowerCase().includes(q) || (c.notes || "").toLowerCase().includes(q));

  return (
    <div className="max-w-2xl mx-auto p-6 px-4">
      <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
        <h1 className="text-xl font-medium">
          My network{" "}
          {contacts.length > 0 && <span className="font-normal text-sm text-muted-foreground">· {contacts.length}</span>}
        </h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => onNavigate("actions")} className="gap-1.5">
            Actions
            {alertActions.length > 0 && (
              <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">{alertActions.length}</Badge>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate("ask")}>Ask AI ✦</Button>
          <Button size="sm" onClick={() => onNavigate("add")}>+ Add</Button>
          <ThemeToggle />
        </div>
      </div>

      {alertActions.length > 0 && (
        <div
          onClick={() => onNavigate("actions")}
          className="flex items-center gap-2 bg-warning text-warning-foreground rounded-lg px-3.5 py-2.5 mb-4 cursor-pointer text-sm font-medium"
        >
          <TriangleAlert className="h-4 w-4 shrink-0" />
          <span>{alertActions.length} action item{alertActions.length > 1 ? "s" : ""} need your attention</span>
          <span className="ml-auto text-xs opacity-75">View →</span>
        </div>
      )}

      {contacts.length > 0 && (
        <div className="flex gap-2 items-center flex-wrap pt-4 border-t mb-3">
          <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <label>
            <Button variant="outline" size="sm" asChild className="gap-1.5 cursor-pointer">
              <span><Upload className="h-3.5 w-3.5" /> Import</span>
            </Button>
            <input type="file" accept=".json" onChange={onImport} className="hidden" />
          </label>
          <span className="text-xs text-muted-foreground ml-1">Save a backup after each session</span>
        </div>
      )}

      {contacts.length > 0 && (
        <Input
          className="mb-4"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, company, or notes..."
        />
      )}

      {contacts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm mb-3">No contacts yet.</p>
          <Button onClick={() => onNavigate("add")}>Add your first contact</Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No contacts match your search.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const cActions = actions.filter(a => a.contact_id === c.id && !a.done);
            const urgent = cActions.filter(a => a.due_date && (daysUntil(a.due_date) ?? 99) <= 1);
            return (
              <Card
                key={c.id}
                className="flex items-center gap-3 p-3 cursor-pointer hover:border-muted-foreground/50 transition-colors"
                onClick={() => onSelectContact(c)}
              >
                <Avatar name={c.name} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  {(c.role || c.company) && (
                    <p className="text-xs text-muted-foreground truncate">{[c.role, c.company].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
                <div className="flex gap-1.5 items-center shrink-0">
                  {urgent.length > 0 && <Badge variant="destructive" className="text-[10px]">{urgent.length} due</Badge>}
                  {cActions.length > 0 && urgent.length === 0 && <Badge variant="secondary" className="text-[10px]">{cActions.length} open</Badge>}
                  {c.date && <span className="text-xs text-muted-foreground">{c.date}</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

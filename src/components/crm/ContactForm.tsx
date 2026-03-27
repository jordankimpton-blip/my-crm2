"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ContactFormProps {
  form: { name: string; company: string; role: string; linkedin: string; notes: string; date: string; actionText: string; actionDueDate: string };
  formError: string;
  setForm: (f: ContactFormProps["form"]) => void;
  onSave: () => void;
  onBack: () => void;
}

export function ContactForm({ form, formError, setForm, onSave, onBack }: ContactFormProps) {
  return (
    <div className="max-w-2xl mx-auto p-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium">Add contact</h1>
        <Button variant="outline" size="sm" onClick={onBack}>← Back</Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Name *</Label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Company</Label>
            <Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Acme Corp" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Role</Label>
            <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="CTO" />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">LinkedIn URL (optional)</Label>
          <Input value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} placeholder="https://linkedin.com/in/janesmith" />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Date met</Label>
          <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Meeting notes</Label>
          <Textarea className="min-h-[120px] resize-y" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Discussed AI strategy..." />
        </div>

        <Separator />

        <div>
          <p className="text-sm font-medium mb-2">Action item <span className="font-normal text-muted-foreground">(optional)</span></p>
          <div className="space-y-3">
            <Input value={form.actionText} onChange={e => setForm({ ...form, actionText: e.target.value })} placeholder="Send intro email, share deck..." />
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Due date</Label>
              <Input type="date" value={form.actionDueDate} onChange={e => setForm({ ...form, actionDueDate: e.target.value })} />
            </div>
          </div>
        </div>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <Button onClick={onSave} className="w-full">Save contact</Button>
      </div>
    </div>
  );
}

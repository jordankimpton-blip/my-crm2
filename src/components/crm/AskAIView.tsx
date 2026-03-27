"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AskAIViewProps {
  contacts: { length: number };
  aiMessages: { role: string; content: string }[];
  aiInput: string;
  aiLoading: boolean;
  setAiInput: (s: string) => void;
  setAiMessages: (m: { role: string; content: string }[]) => void;
  onAsk: () => void;
  onBack: () => void;
}

export function AskAIView({ contacts, aiMessages, aiInput, aiLoading, setAiInput, setAiMessages, onAsk, onBack }: AskAIViewProps) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);

  return (
    <div className="max-w-2xl mx-auto p-6 px-4 flex flex-col min-h-[500px]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium">Ask about your network</h1>
        <div className="flex gap-2">
          {aiMessages.length > 0 && <Button variant="outline" size="sm" onClick={() => setAiMessages([])}>Clear</Button>}
          <Button variant="outline" size="sm" onClick={onBack}>← Back</Button>
        </div>
      </div>

      {contacts.length === 0 && <p className="text-sm text-muted-foreground">Add some contacts first.</p>}

      <ScrollArea className="flex-1 mb-4 flex flex-col gap-3">
        {aiMessages.length === 0 && contacts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {["Who has experience in AI?", "Who works at a startup?", "What are my open action items?", "Summarise my network"].map(q => (
              <Button
                key={q}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => { setAiInput(q); setTimeout(() => document.getElementById("ai-send")?.click(), 50); }}
              >
                {q}
              </Button>
            ))}
          </div>
        )}

        {aiMessages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap mb-3 ${
              m.role === "user"
                ? "self-end bg-primary text-primary-foreground ml-auto"
                : "self-start bg-card"
            }`}
          >
            {m.content}
          </div>
        ))}

        {aiLoading && <p className="text-sm text-muted-foreground py-2">Thinking...</p>}
        <div ref={endRef} />
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          className="flex-1"
          value={aiInput}
          onChange={e => setAiInput(e.target.value)}
          placeholder="Who in my network has built AI products?"
          onKeyDown={e => e.key === "Enter" && onAsk()}
        />
        <Button id="ai-send" onClick={onAsk} disabled={aiLoading}>Ask</Button>
      </div>
    </div>
  );
}

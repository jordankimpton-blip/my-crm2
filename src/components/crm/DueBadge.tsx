import { daysUntil } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";

export function DueBadge({ dateStr }: { dateStr: string }) {
  const d = daysUntil(dateStr);
  if (d === null) return null;

  if (d < 0) return <Badge variant="destructive" className="text-[11px] font-medium">{Math.abs(d)}d overdue</Badge>;
  if (d === 0) return <Badge variant="warning" className="text-[11px] font-medium">Due today</Badge>;
  if (d <= 3) return <Badge variant="warning" className="text-[11px] font-medium">Due in {d}d</Badge>;
  return (
    <Badge variant="success" className="text-[11px] font-medium">
      {new Date(dateStr).toLocaleDateString("en-NZ", { day: "numeric", month: "short" })}
    </Badge>
  );
}

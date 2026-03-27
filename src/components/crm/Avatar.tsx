import { getColor, initials, COLOR_MAP } from "@/lib/colors";

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const { bg, text } = COLOR_MAP[getColor(name)] || COLOR_MAP["c-blue"];
  return (
    <div
      className="rounded-full flex items-center justify-center font-medium shrink-0"
      style={{ width: size, height: size, backgroundColor: bg, color: text, fontSize: size * 0.33 }}
    >
      {initials(name)}
    </div>
  );
}

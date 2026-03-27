const COLORS = ["c-blue", "c-teal", "c-purple", "c-coral", "c-pink", "c-amber", "c-green"];

export function getColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % COLORS.length;
  return COLORS[h];
}

export function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0] || "").join("").toUpperCase() || "?";
}

export const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  "c-blue":   { bg: "#E6F1FB", text: "#0C447C" },
  "c-teal":   { bg: "#E1F5EE", text: "#085041" },
  "c-purple": { bg: "#EEEDFE", text: "#3C3489" },
  "c-coral":  { bg: "#FAECE7", text: "#712B13" },
  "c-pink":   { bg: "#FBEAF0", text: "#72243E" },
  "c-amber":  { bg: "#FAEEDA", text: "#633806" },
  "c-green":  { bg: "#EAF3DE", text: "#27500A" },
};

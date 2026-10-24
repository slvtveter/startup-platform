import { getStartup } from "@/lib/api";
import { plural, TERMS } from "@/lib/labels";
import { OG_SIZE, ogImage } from "@/lib/og";
import { publicClient } from "@/lib/server-api";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Стартап ищет людей в команду";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: s } = await getStartup({ client: publicClient(), path: { slug } });
  if (!s) return ogImage({ title: "Стартап не найден", subtitle: "", filled: 0, open: 0, footer: "" });
  const open = s.open_roles.reduce((n, r) => n + (r.slots ?? 1), 0);
  const roles = s.open_roles.slice(0, 2).map((r) => r.title).join(", ");
  return ogImage({
    title: s.title,
    subtitle: s.pitch,
    filled: s.team_size ?? 1,
    open,
    footer: open
      ? `${plural(open, "Свободно 1 место", `Свободно ${open} места`, `Свободно ${open} мест`)}: ${roles}. ${TERMS[s.terms]}`
      : "Команда собрана",
  });
}

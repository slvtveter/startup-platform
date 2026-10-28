import { getStartup } from "@/lib/api";
import { plural, STAGE, TERMS } from "@/lib/labels";
import { OG_SIZE, ogImage } from "@/lib/og";
import { publicClient } from "@/lib/server-api";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Стартап ищет людей в команду";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: s } = await getStartup({ client: publicClient(), path: { slug } });
  if (!s) return ogImage({ title: "Стартап не найден", aside: { kind: "photo" } });
  const open = s.open_roles.reduce((n, r) => n + (r.slots ?? 1), 0);
  return ogImage({
    eyebrow: `${STAGE[s.stage]} · ${TERMS[s.terms]}`,
    title: s.title,
    subtitle: s.pitch,
    chips: s.open_roles.slice(0, 3).map((r) => ({ text: r.title })),
    aside: {
      kind: "tile",
      letter: s.title.trim().charAt(0).toUpperCase() || "E",
      caption: open ? `Ищут: ${open} ${plural(open, "место", "места", "мест")} в команде` : "Команда собрана",
    },
  });
}

import { getPerson } from "@/lib/api";
import { COFOUND, initials, LEVEL } from "@/lib/labels";
import { OG_SIZE, ogImage } from "@/lib/og";
import { publicClient } from "@/lib/server-api";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Профиль на Envola";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: p } = await getPerson({ client: publicClient(), path: { slug } });
  if (!p) return ogImage({ title: "Профиль не найден", aside: { kind: "photo" } });
  const role = [p.primary_role?.name, p.experience_level && LEVEL[p.experience_level].toLowerCase()].filter(Boolean).join(", ");
  return ogImage({
    eyebrow: role || undefined,
    title: p.display_name,
    subtitle: p.headline || undefined,
    chips: [
      ...(p.looking_for.includes(COFOUND) ? [{ text: "Ищет сообщников", accent: true }] : []),
      ...p.skills.slice(0, 3).map((s) => ({ text: s.name })),
    ],
    aside: { kind: "tile", letter: initials(p.display_name), caption: p.city || "Envola", round: true },
  });
}

import { getPerson } from "@/lib/api";
import { LEVEL, TERMS } from "@/lib/labels";
import { OG_SIZE, ogImage } from "@/lib/og";
import { initials } from "@/lib/labels";
import { publicClient } from "@/lib/server-api";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Профиль на envola";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: p } = await getPerson({ client: publicClient(), path: { slug } });
  if (!p) return ogImage({ title: "Профиль не найден", subtitle: "", filled: 0, open: 0, footer: "" });
  const role = [p.primary_role?.name, p.experience_level && LEVEL[p.experience_level].toLowerCase()].filter(Boolean).join(", ");
  const looking = p.looking_for.map((t) => TERMS[t].toLowerCase()).join(", ");
  return ogImage({
    title: p.display_name,
    subtitle: p.headline || role,
    filled: 1,
    open: 0,
    initials: initials(p.display_name),
    footer: [role, looking && `ищет проект: ${looking}`].filter(Boolean).join(". "),
  });
}

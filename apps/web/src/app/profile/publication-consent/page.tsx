import type { Metadata } from "next";

import { LegalDoc } from "@/components/site/legal-doc";
import { HTML, TITLE } from "@/lib/legal/publication";

export const metadata: Metadata = { title: "Согласие на публикацию профиля", alternates: { canonical: "/profile/publication-consent" } };

export default function PublicationConsentPage() {
  return <LegalDoc title={TITLE} html={HTML} />;
}

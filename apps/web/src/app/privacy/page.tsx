import type { Metadata } from "next";

import { LegalDoc } from "@/components/site/legal-doc";
import { HTML, TITLE } from "@/lib/legal/privacy";

export const metadata: Metadata = { title: "Политика конфиденциальности", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return <LegalDoc title={TITLE} html={HTML} />;
}

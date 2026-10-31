import type { Metadata } from "next";

import { LegalDoc } from "@/components/site/legal-doc";
import { HTML, TITLE } from "@/lib/legal/terms";

export const metadata: Metadata = { title: TITLE, alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return <LegalDoc title={TITLE} html={HTML} />;
}

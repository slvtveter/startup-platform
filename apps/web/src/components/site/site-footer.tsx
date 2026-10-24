import Link from "next/link";

import { FeedbackButton } from "@/components/site/feedback-button";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <div>
          <div className="font-extrabold text-foreground">
            startup<span className="text-brand">.platform</span>
          </div>
          <p className="mt-1 max-w-sm">Первый реальный опыт в IT и команда для твоей идеи.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 sm:ml-auto">
          <Link href="/startups" className="hover:text-foreground">
            Стартапы
          </Link>
          <Link href="/people" className="hover:text-foreground">
            Люди
          </Link>
          <Link href="/startups/new" className="hover:text-foreground">
            Создать стартап
          </Link>
          <FeedbackButton />
        </nav>
      </div>
    </footer>
  );
}

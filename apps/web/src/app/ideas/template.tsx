import { PageEnter } from "@/components/site/page-enter";

/** Новый ключ на каждую навигацию в этом разделе: страница заново проявляется (PageEnter). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageEnter>{children}</PageEnter>;
}

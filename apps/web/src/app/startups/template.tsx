/** Новый ключ на каждую навигацию в этом разделе: страница заново проявляется (.page-enter в globals.css). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}

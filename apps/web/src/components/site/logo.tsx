import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="text-lg font-extrabold tracking-tight">
      startup<span className="text-brand">.platform</span>
    </Link>
  );
}

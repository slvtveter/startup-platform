export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-12">
      <div className="w-full max-w-[440px] rounded-3xl border bg-card p-8 sm:p-10">
        <h1 className="text-3xl font-extrabold">{title}</h1>
        {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-destructive">{message}</p>;
}

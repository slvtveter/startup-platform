export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl sm:text-[34px] sm:leading-tight">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex gap-2 sm:ml-auto">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
      <div className="text-lg font-extrabold">{title}</div>
      {text && <p className="mx-auto mt-2 max-w-md text-muted-foreground">{text}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 ${className}`}>{children}</div>;
}

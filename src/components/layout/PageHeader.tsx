interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7 sm:mb-10 lg:mb-12">
      <div>
        <h1 className="text-3xl sm:text-4xl display-heading tracking-tight">{title}</h1>
        {description && (
          <p className="text-base text-muted-foreground mt-2 font-sans">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

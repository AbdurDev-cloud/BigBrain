import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  showBack?: boolean;
}

export function PageHeader({ title, description, action, showBack = true }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7 sm:mb-10 lg:mb-12">
      <div className="flex items-start gap-4">
        {showBack && <button type="button" onClick={() => navigate('/')} aria-label="Back to dashboard" className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-warm/30 bg-warm/10 text-warm-foreground shadow-sm transition-all hover:-translate-x-0.5 hover:bg-warm/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm"><ArrowLeft className="h-5 w-5" strokeWidth={2.2} /></button>}
        <div>
        <h1 className="text-3xl sm:text-4xl display-heading tracking-tight">{title}</h1>
        {description && (
          <p className="text-base text-muted-foreground mt-2 font-sans">{description}</p>
        )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

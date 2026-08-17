import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  showBack?: boolean;
}

export function MenuBackButton() {
  return <button type="button" onClick={() => window.dispatchEvent(new Event('bigbrain:open-menu'))} aria-label="Open menu" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm"><ArrowLeft className="h-5 w-5" strokeWidth={2} /></button>;
}

export function PageHeader({ title, description, action, showBack = true }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7 sm:mb-10 lg:mb-12">
      <div className="flex items-start gap-4">
        {showBack && <div className="mt-1"><MenuBackButton /></div>}
        <div>
        <button type="button" onClick={() => navigate('/')} className="text-left text-3xl sm:text-4xl display-heading tracking-tight transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm rounded-sm">{title}</button>
        {description && (
          <p className="text-base text-muted-foreground mt-2 font-sans">{description}</p>
        )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Menu } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    const openSidebar = () => setSidebarOpen(true);
    window.addEventListener('bigbrain:open-menu', openSidebar);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('bigbrain:open-menu', openSidebar);
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = window.setTimeout(() => setIsLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      setInstallPrompt(null);
      return;
    }
    if (isIOS) {
      window.alert('To install BigBrain on iPhone: open this site in Safari, tap Share, choose “Add to Home Screen”, enable “Open as Web App”, then tap Add.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {isLoading && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-background/75 backdrop-blur-[2px]" aria-live="polite" aria-label="Loading BigBrain">
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-warm/30 bg-background shadow-[0_0_0_10px_hsl(var(--warm)/0.08)]">
              <span className="absolute h-3 w-3 rounded-full bg-warm shadow-[0_0_22px_hsl(var(--warm)/0.85)]" />
              <span className="h-14 w-14 rounded-full border-2 border-dashed border-warm/70 animate-spin" />
            </div>
            <span className="font-mono text-[11px] tracking-[0.28em] text-muted-foreground/70">TUNING YOUR FOCUS</span>
          </div>
        </div>
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Top bar with hamburger */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="px-4 sm:px-6 md:px-10 lg:px-14 py-3 flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-lg display-heading tracking-tight text-foreground/70">BigBrain</span>
          {(installPrompt || isIOS) && (
            <button
              onClick={handleInstall}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Install BigBrain"
            >
              <Download className="h-4 w-4" />
              Install
            </button>
          )}
        </div>
      </header>

      <main>
        <ScrollArea className="h-[calc(100vh-3.5rem)]">
          <div className="page-transition flex min-h-full w-full flex-col px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 py-6 sm:py-8 lg:py-10">
            <div className="flex-1"><Outlet /></div>
            <footer className="mt-16 border-t border-border/40 pt-5 pb-2 text-center text-xs text-muted-foreground/60 font-mono">
              © {new Date().getFullYear()} <a href="mailto:abdurebon@gmail.com" className="transition-colors hover:text-foreground">aBduR raHAMAN</a>
            </footer>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

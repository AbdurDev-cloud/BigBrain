import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Menu } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
          <div className="page-transition w-full px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 py-6 sm:py-8 lg:py-10">
            <Outlet />
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

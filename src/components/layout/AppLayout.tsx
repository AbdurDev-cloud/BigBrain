import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu } from 'lucide-react';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        </div>
      </header>

      <main>
        <ScrollArea className="h-[calc(100vh-3.5rem)]">
          <div className="w-full px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 py-6 sm:py-8 lg:py-10">
            <Outlet />
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

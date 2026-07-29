import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  StickyNote,
  FolderKanban,
  Heart,
  TrendingUp,
  X,
} from 'lucide-react';

interface Quote {
  text: string;
  author: string;
}

const MOTIVATIONAL_QUOTES: Quote[] = [
  {
    text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Aristotle',
  },
  {
    text: 'Small daily improvements over time lead to stunning results.',
    author: 'Robin Sharma',
  },
  {
    text: 'Discipline is choosing between what you want now and what you want most.',
    author: 'Abraham Lincoln',
  },
  {
    text: 'The expert in anything was once a beginner.',
    author: 'Helen Hayes',
  },
  {
    text: 'Action is the foundational key to all success.',
    author: 'Pablo Picasso',
  },
  {
    text: 'The mind is not a vessel to be filled, but a fire to be kindled.',
    author: 'Plutarch',
  },
  {
    text: 'Success is the sum of small efforts, repeated day in and day out.',
    author: 'Robert Collier',
  },
  {
    text: "It's not that I'm so smart, it's just that I stay with problems longer.",
    author: 'Albert Einstein',
  },
  {
    text: "You don't have to be great to start, but you have to start to be great.",
    author: 'Zig Ziglar',
  },
  {
    text: 'Continuous learning is the minimum requirement for success in any field.',
    author: 'Brian Tracy',
  },
  {
    text: 'Mastery requires patience, practice, and persistent action.',
    author: 'Robert Greene',
  },
  {
    text: 'An investment in knowledge pays the best interest.',
    author: 'Benjamin Franklin',
  },
  {
    text: 'What we achieve inwardly will change outer reality.',
    author: 'Plutarch',
  },
  {
    text: 'Be not afraid of growing slowly, be afraid only of standing still.',
    author: 'Chinese Proverb',
  },
  {
    text: "Don't judge each day by the harvest you reap, but by the seeds that you plant.",
    author: 'Robert Louis Stevenson',
  },
  {
    text: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
  },
  {
    text: 'Focus on being productive instead of busy.',
    author: 'Tim Ferriss',
  },
  {
    text: 'Do something today that your future self will thank you for.',
    author: 'Sean Patrick Flanery',
  },
  {
    text: 'Small steps in the right direction can turn out to be the biggest step of your life.',
    author: 'Unknown',
  },
  {
    text: "You miss 100% of the shots you don't take.",
    author: 'Wayne Gretzky',
  },
];

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Study', href: '/study', icon: BookOpen },
  { name: 'Journal', href: '/journal', icon: PenLine },
  { name: 'Notes', href: '/notes', icon: StickyNote },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Health', href: '/health', icon: Heart },
  { name: 'Progress', href: '/progress', icon: TrendingUp },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const dayOfYear = getDayOfYear(today);
  const quoteIndex = Math.abs(dayOfYear - 1) % MOTIVATIONAL_QUOTES.length;
  const quote = MOTIVATIONAL_QUOTES[quoteIndex];

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-400 ${
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
    >
      {/* Full-screen backdrop */}
      <div 
        className="absolute inset-0 bg-background/95 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Menu content */}
      <div className={`relative h-full flex flex-col transition-transform duration-400 ease-out ${
        isOpen ? 'translate-y-0' : '-translate-y-8'
      }`}>
        
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 sm:px-10 py-5 sm:py-6">
          <div>
            <h1 className="text-3xl display-heading tracking-tight text-foreground">BigBrain</h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono opacity-60">
              {greeting} — {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-2xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-7 w-7" />
          </button>
        </div>

        {/* Main area — nav left, quote right */}
        <div className="flex-1 flex items-center justify-center px-5 sm:px-10 overflow-y-auto">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-8 lg:gap-16 w-full max-w-4xl py-6">
            
            {/* Navigation */}
            <nav className="flex-1">
              <ul className="space-y-2">
                {navigation.map((item, index) => {
                  const isActive =
                    item.href === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.href);

                  return (
                    <li 
                      key={item.name}
                      className={`transition-all duration-300 ease-out ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                      style={{ transitionDelay: isOpen ? `${index * 50}ms` : '0ms' }}
                    >
                      <NavLink
                        to={item.href}
                        onClick={onClose}
                        className={`
                          flex items-center gap-4 sm:gap-5 px-5 sm:px-6 py-4 sm:py-5 rounded-2xl text-xl sm:text-2xl font-medium
                          transition-all duration-200
                          ${
                            isActive
                              ? 'bg-warm/15 text-warm-foreground border border-warm/30'
                              : 'text-foreground/50 hover:text-foreground hover:bg-muted/50 border border-transparent'
                          }
                        `}
                      >
                        <item.icon className={`h-7 w-7 shrink-0 transition-colors duration-200 ${isActive ? 'text-warm-foreground' : ''}`} strokeWidth={1.5} />
                        {item.name}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Daily Spark — right side */}
            <div 
              className={`w-full max-w-sm mx-auto lg:mx-0 lg:w-72 shrink-0 flex flex-col justify-center transition-all duration-500 ease-out ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
              style={{ transitionDelay: isOpen ? '400ms' : '0ms' }}
            >
              <div 
                className="p-8 rounded-3xl relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
              >
                {/* Glass shine */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-3xl" />
                
                <div className="relative">
                  <div className="flex items-center gap-2 text-xs font-mono font-medium uppercase tracking-wider mb-5" style={{ color: 'rgba(200,170,130,0.9)' }}>
                    <span className="text-lg">✨</span>
                    <span>Daily Spark</span>
                  </div>
                  <blockquote className="font-serif italic text-lg text-foreground leading-relaxed">
                    "{quote.text}"
                  </blockquote>
                  <p className="text-sm text-muted-foreground/70 mt-4 font-sans font-medium">
                    — {quote.author}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-10 py-5 sm:py-6">
          <p className="text-xs text-muted-foreground/40 font-mono">
            Everything stored locally in your browser
          </p>
        </div>
      </div>
    </div>
  );
}

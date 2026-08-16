import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { StudyPage } from '@/pages/StudyPage';
import { JournalPage } from '@/pages/JournalPage';
import { NotesPage } from '@/pages/NotesPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { HealthPage } from '@/pages/HealthPage';
import { ProgressPage } from '@/pages/ProgressPage';
import { GuitarPage } from '@/pages/GuitarPage';

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/guitar" element={<GuitarPage />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  );
}

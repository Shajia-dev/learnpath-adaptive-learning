import { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { AppProvider } from '@/lib/AppContext';
import { AuthPage } from '@/components/AuthPage';
import { Onboarding } from '@/components/Onboarding';
import { AppLayout, type Page } from '@/components/AppLayout';
import { Dashboard } from '@/components/pages/Dashboard';
import { MyPlan } from '@/components/pages/MyPlan';
import { Learn } from '@/components/pages/Learn';
import { Projects } from '@/components/pages/Projects';
import { Resources } from '@/components/pages/Resources';
import { Progress } from '@/components/pages/Progress';
import { AIMentor } from '@/components/pages/AIMentor';
import { Settings } from '@/components/pages/Settings';
import { GraduationCap, Loader2 } from 'lucide-react';

function AppContent() {
  const { session, goal, loading } = useApp();
  const [page, setPage] = useState<Page>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-xl bg-teal-600 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  if (!goal || !goal.onboarded) {
    return <Onboarding />;
  }

  return (
    <AppLayout currentPage={page} onNavigate={setPage}>
      {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
      {page === 'plan' && <MyPlan />}
      {page === 'learn' && <Learn onNavigate={setPage} />}
      {page === 'projects' && <Projects />}
      {page === 'resources' && <Resources />}
      {page === 'progress' && <Progress />}
      {page === 'mentor' && <AIMentor />}
      {page === 'settings' && <Settings />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { PortalHome } from './pages/PortalHome';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminShortcutListener } from './components/AdminShortcutListener';
import { ToastContainer } from './components/Toast';
import { ToastMessage } from './types';
import { ShieldCheck } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isAdmin } = useAuth();

  // Navigation state
  const [currentView, setCurrentView] = useState<'portal' | 'admin'>('portal');
  const [globalSearch, setGlobalSearch] = useState('');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminLoginModalOpen, setAdminLoginModalOpen] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, message?: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keyboard shortcut handler (CTRL + SHIFT + A)
  const handleAdminShortcutTriggered = () => {
    if (isAdmin) {
      setCurrentView('admin');
      addToast('Administrator Access', 'Switched to System Administration Console', 'success');
    } else {
      setAdminLoginModalOpen(true);
      addToast('Admin Portal Activated', 'Please authenticate with administrative credentials', 'info');
    }
  };

  const handleNavigate = (view: 'portal' | 'admin') => {
    if (view === 'admin') {
      if (isAdmin) {
        setCurrentView('admin');
      } else {
        setAdminLoginModalOpen(true);
      }
    } else {
      setCurrentView('portal');
    }
  };

  return (
    <div id="media-portal-app" className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Hidden Admin Shortcut Listener: CTRL + SHIFT + A */}
      <AdminShortcutListener onTrigger={handleAdminShortcutTriggered} />

      {/* Main View Router */}
      {currentView === 'admin' && isAdmin ? (
        <AdminDashboard
          onExitAdmin={() => setCurrentView('portal')}
          onNotify={addToast}
        />
      ) : (
        <>
          {/* Main User Navbar */}
          <Navbar
            searchQuery={globalSearch}
            onSearchChange={setGlobalSearch}
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenAdminLogin={() => setAdminLoginModalOpen(true)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />

          {/* User Home Portal Page */}
          <main className="flex-1">
            <PortalHome
              onPromptLogin={() => setAuthModalOpen(true)}
              onNotify={addToast}
            />
          </main>

          {/* Clean Portal Footer */}
          <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-4 sm:px-8 text-center bg-white/50 dark:bg-slate-900/50">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <p>
                &copy; {new Date().getFullYear()} Media Portal &middot; Secure Digital Asset Management.
              </p>
              <div className="flex items-center gap-4">
                <span>Vercel Serverless Ready</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Bcrypt Authentication &amp; RBAC
                </span>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* User Login & Registration Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => addToast('Welcome!', 'You have successfully authenticated.', 'success')}
      />

      {/* Hidden Admin Login Modal (Triggered by CTRL + SHIFT + A) */}
      <AdminLoginModal
        isOpen={adminLoginModalOpen}
        onClose={() => setAdminLoginModalOpen(false)}
        onSuccess={() => {
          setCurrentView('admin');
          addToast('Privileged Session', 'Logged in as Administrator', 'success');
        }}
      />

      {/* Global Toast System */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

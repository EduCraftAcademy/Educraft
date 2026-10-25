import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { SystemStatusModal } from './components/SystemStatusModal';
import { CheckoutModal } from './components/CheckoutModal';
import { HomeView } from './views/HomeView';
import { AILessonStudioView } from './views/AILessonStudioView';
import { StudentDashboardView } from './views/StudentDashboardView';
import { ParentDashboardView } from './views/ParentDashboardView';
import { TeacherDashboardView } from './views/TeacherDashboardView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { LiveClassesView } from './views/LiveClassesView';
import { SubscriptionsView } from './views/SubscriptionsView';
import { HomeworkView } from './views/HomeworkView';
import { GraduationCap, ShieldCheck, Heart, Sparkles } from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [isStatusOpen, setIsStatusOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenStatus={() => setIsStatusOpen(true)}
      />

      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            onNavigate={setCurrentView}
            onOpenPlans={() => setCurrentView('subscriptions')}
          />
        )}
        {currentView === 'ai-studio' && <AILessonStudioView />}
        {currentView === 'student' && <StudentDashboardView onNavigate={setCurrentView} />}
        {currentView === 'parent' && <ParentDashboardView onNavigate={setCurrentView} />}
        {currentView === 'teacher' && <TeacherDashboardView onNavigate={setCurrentView} />}
        {currentView === 'admin' && <AdminDashboardView />}
        {currentView === 'live-classes' && <LiveClassesView onNavigate={setCurrentView} />}
        {currentView === 'subscriptions' && <SubscriptionsView />}
        {currentView === 'homework' && <HomeworkView />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8 mt-12 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <GraduationCap className="w-4 h-4" />
              </div>
              EduCraft AI Studio
            </div>
            <p className="leading-relaxed text-slate-400">
              Plateforme d'excellence éducative combinant intelligence artificielle pédagogique et enseignants salariés qualifiés au Maroc.
            </p>
            <div className="text-[11px] text-slate-500">
              Casablanca, Maroc • contact@educraft.ma
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Cycles Enseignés</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>École Primaire (1ère à 6ème AP)</li>
              <li>Collège (1AC, 2AC, 3AC / Brevet)</li>
              <li>Lycée Tronc Commun Scientifique</li>
              <li>1ère & 2ème Baccalauréat National</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Programmes Officiels</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>Marocain International (BIOF - Français)</li>
              <li>Marocain National Général (Arabe)</li>
              <li>Mission Française Homologuée (AEFE)</li>
              <li>Cambridge & International Track</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Garanties & Rémunération</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>Enseignants sous contrat avec salaires fixes</li>
              <li>Paiements sécurisés CMI & Virements en MAD</li>
              <li>Période de grâce de 3 jours préservant les acquis</li>
              <li>Exports réels PDF, DOCX et PowerPoint</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} EduCraft AI Studio SARL. Tous droits réservés.
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsStatusOpen(true)} className="hover:text-white transition">
              Diagnostics & Intégrations
            </button>
            <button onClick={() => setCurrentView('subscriptions')} className="hover:text-white transition">
              Tarification en MAD
            </button>
          </div>
        </div>
      </footer>

      {/* System Status Diagnostic Modal */}
      <SystemStatusModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

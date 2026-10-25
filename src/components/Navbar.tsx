import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Users,
  Video,
  FileCheck2,
  CreditCard,
  Shield,
  Activity,
  ChevronDown,
  LogOut,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenStatus: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenStatus }) => {
  const { user, activeChild, childrenList, setActiveChild, demoAccounts, switchPersona, logout } = useAuth();
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [childMenuOpen, setChildMenuOpen] = useState(false);

  // Determine if grace period is active
  const isGracePeriod =
    user?.role === 'student' && user.studentProfile?.subscriptionStatus === 'grace_period';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Grace period notification banner */}
      {isGracePeriod && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Période de grâce active (3 jours restants) : Votre abonnement a expiré. Veuillez renouveler votre forfait pour maintenir vos cours en direct et enregistrements.
          </span>
          <button
            onClick={() => onNavigate('subscriptions')}
            className="underline ml-2 hover:text-black font-extrabold cursor-pointer"
          >
            Renouveler maintenant →
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-700 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">
                EduCraft <span className="text-blue-600">AI Studio</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">
                Plateforme d'Excellence Scolaire & Enseignants
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-lg transition ${
                currentView === 'home' ? 'text-blue-600 bg-blue-50 font-bold' : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Accueil
            </button>

            <button
              onClick={() => onNavigate('ai-studio')}
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                currentView === 'ai-studio'
                  ? 'text-blue-600 bg-blue-50 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Studio IA
            </button>

            <button
              onClick={() => onNavigate('student')}
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                currentView === 'student'
                  ? 'text-blue-600 bg-blue-50 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Espace Élève
            </button>

            <button
              onClick={() => onNavigate('live-classes')}
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                currentView === 'live-classes'
                  ? 'text-blue-600 bg-blue-50 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-red-500" /> Cours en Direct
            </button>

            <button
              onClick={() => onNavigate('homework')}
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                currentView === 'homework'
                  ? 'text-blue-600 bg-blue-50 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" /> Devoirs
            </button>

            <button
              onClick={() => onNavigate('parent')}
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                currentView === 'parent'
                  ? 'text-blue-600 bg-blue-50 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-teal-600" /> Espace Parents
            </button>

            <button
              onClick={() => onNavigate('teacher')}
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                currentView === 'teacher'
                  ? 'text-blue-600 bg-blue-50 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> Enseignants
            </button>

            <button
              onClick={() => onNavigate('admin')}
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                currentView === 'admin'
                  ? 'text-blue-600 bg-blue-50 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-600" /> Administration
            </button>

            <button
              onClick={() => onNavigate('subscriptions')}
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                currentView === 'subscriptions'
                  ? 'text-blue-600 bg-blue-50 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Tarifs (MAD)
            </button>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2">
            {/* System Status Diagnostic Pill */}
            <button
              onClick={onOpenStatus}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition"
              title="Vérifier la santé et les intégrations des passerelles"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">État Système</span>
            </button>

            {/* Child Selector (If parent with multiple children) */}
            {user?.role === 'parent' && childrenList.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setChildMenuOpen(!childMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold transition hover:bg-teal-100"
                >
                  <span>Élève : {activeChild?.name?.split(' ')[0] || 'Enfant'}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {childMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">
                      Mes Enfants
                    </div>
                    {childrenList.map(ch => (
                      <button
                        key={ch.id}
                        onClick={() => {
                          setActiveChild(ch);
                          setChildMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition flex items-center justify-between ${
                          activeChild?.id === ch.id ? 'bg-teal-50 text-teal-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>{ch.name}</span>
                        <span className="text-[10px] text-slate-400">{ch.studentProfile?.grade.slice(0, 7)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Demo Persona Switcher Dropdown (Multi-Role Testing) */}
            <div className="relative">
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">
                  {user?.name ? `${user.name.split(' ')[0]} (${user.role})` : 'Changer Rôle'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 overflow-hidden">
                  <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                      Sélecteur de Persona (5 Rôles)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Testez instantanément les permissions de chaque profil.
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {demoAccounts.map(acc => (
                      <button
                        key={acc.id}
                        onClick={() => {
                          switchPersona(acc.id);
                          setDemoMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 transition flex flex-col ${
                          user?.id === acc.id ? 'bg-blue-50/80 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{acc.name}</span>
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                            {acc.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 line-clamp-1">{acc.detail}</span>
                      </button>
                    ))}
                  </div>

                  {user && (
                    <div className="pt-2 border-t border-slate-100 px-2">
                      <button
                        onClick={() => {
                          logout();
                          setDemoMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

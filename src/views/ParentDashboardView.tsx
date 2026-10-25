import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentApi, subscriptionApi, classesApi } from '../api/client';
import { PaymentTransaction, ScheduledClass, SubscriptionPlan } from '../types';
import { CheckoutModal } from '../components/CheckoutModal';
import {
  Users,
  Award,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  Plus,
  AlertTriangle,
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';

interface ParentDashboardViewProps {
  onNavigate: (view: string) => void;
}

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({ onNavigate }) => {
  const { user, activeChild, childrenList, setActiveChild, refreshUser } = useAuth();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildGrade, setNewChildGrade] = useState('1ère Année Collège (1AC)');
  const [newChildCurriculum, setNewChildCurriculum] = useState('moroccan-biof');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    subscriptionApi.getHistory().then(res => {
      if (res.success) setPayments(res.payments);
    });

    subscriptionApi.getPlans().then(res => {
      if (res.success) setPlans(res.plans);
    });

    classesApi.getTimetable().then(res => {
      if (res.success) setClasses(res.classes);
    });
  }, []);

  const currentChild = activeChild || childrenList[0];
  const isGracePeriod = currentChild?.studentProfile?.subscriptionStatus === 'grace_period';

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) return;

    await studentApi.addChild({
      name: newChildName.trim(),
      grade: newChildGrade,
      curriculum: newChildCurriculum,
    });

    setIsAddChildOpen(false);
    setNewChildName('');
    await refreshUser();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-teal-800 via-cyan-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-teal-500/30 text-teal-200">
              Espace Parental & Suivi Scolaire
            </span>
            <span className="text-xs text-teal-300">
              Compte : <strong>{user?.name}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black">Tableau de Bord des Familles</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Suivez en temps réel les progrès, notes officielles sur 20, l'assiduité aux cours en direct et gérez les abonnements de vos enfants en Dirhams (MAD).
          </p>
        </div>

        <button
          onClick={() => setIsAddChildOpen(true)}
          className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Ajouter un Enfant
        </button>
      </div>

      {/* Children Tabs */}
      {childrenList.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Sélectionner l'enfant :
          </span>
          {childrenList.map(ch => (
            <button
              key={ch.id}
              onClick={() => setActiveChild(ch)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                currentChild?.id === ch.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>{ch.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${currentChild?.id === ch.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {ch.studentProfile?.grade.slice(0, 10)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Child Dashboard Content */}
      {currentChild && (
        <div className="space-y-8">
          {/* Grace Period Banner for this child */}
          {isGracePeriod && (
            <div className="p-4 bg-amber-500 text-slate-950 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-bold text-xs shadow-md">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>
                  Attention : L'abonnement de {currentChild.name} est entré dans sa <strong>période de grâce de 3 jours</strong>. Les accès aux cours en direct seront restreints sans renouvellement.
                </span>
              </div>
              <button
                onClick={() => setSelectedPlanForCheckout(plans.find(p => p.id === currentChild.studentProfile?.subscriptionPlanId) || plans[2])}
                className="px-4 py-1.5 bg-slate-950 hover:bg-black text-white text-xs rounded-lg transition shrink-0"
              >
                Renouveler immédiatement
              </button>
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Moyenne Générale</span>
                <Award className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {currentChild.averageGrade ? `${currentChild.averageGrade} / 20` : '18.5 / 20'}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Très bon niveau académique
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Taux de Présence</span>
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {currentChild.attendanceStats?.ratePercentage || 100}%
              </div>
              <span className="text-[11px] text-slate-500">
                {currentChild.attendanceStats?.attended || 3} cours suivis avec assiduité
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Forfait Scolaire</span>
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-purple-700 uppercase">
                {currentChild.studentProfile?.subscriptionPlanId || 'PLUS'}
              </div>
              <span className="text-[11px] text-slate-500">
                {currentChild.studentProfile?.subscriptionPlanId === 'plus' ? '4 cours live/mois' : '8 cours live/mois'}
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Expiration & Statut</span>
                <ShieldCheck className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-base font-bold text-slate-900">
                {new Date(currentChild.studentProfile?.subscriptionExpiresAt || Date.now()).toLocaleDateString('fr-FR')}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">
                Statut : Actif (En règle)
              </span>
            </div>
          </div>

          {/* Split: Timetable & Graded Work */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming timetable */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Emploi du Temps des Cours en Direct
                </h3>
                <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">
                  Demande de changement
                </span>
              </div>

              <div className="space-y-3">
                {classes.map(cls => (
                  <div
                    key={cls.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {cls.subject}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{cls.title}</h4>
                      <p className="text-xs text-slate-500">
                        Professeur : {cls.teacherName} • Horaire : {cls.startTime} - {cls.endTime}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      Confirmé
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grades and Teacher Feedback */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                Notes & Commentaires des Enseignants
              </h3>

              <div className="space-y-3">
                {currentChild.mySubmissions?.length > 0 ? (
                  currentChild.mySubmissions.map((sub: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{sub.subject}</span>
                          <h4 className="font-bold text-slate-900 text-sm">{sub.homeworkTitle}</h4>
                        </div>
                        <span className="text-base font-extrabold text-blue-800 bg-blue-100 px-3 py-1 rounded-xl">
                          {sub.grade}/20
                        </span>
                      </div>
                      {sub.feedback && (
                        <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                          Appréciation : « {sub.feedback} »
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Mathématiques</span>
                        <h4 className="font-bold text-slate-900 text-sm">Devoir Maison : Systèmes d'équations</h4>
                      </div>
                      <span className="text-base font-extrabold text-blue-800 bg-blue-100 px-3 py-1 rounded-xl">
                        18.5/20
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                      « Très bon travail ! Rédaction rigoureuse et calculs exacts. Continue ainsi. »
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment History in MAD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-slate-700" />
              Historique des Règlements & Factures (MAD)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Référence</th>
                    <th className="p-3">Forfait</th>
                    <th className="p-3">Période</th>
                    <th className="p-3">Montant</th>
                    <th className="p-3">Passerelle</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono font-bold text-slate-900">{p.reference}</td>
                      <td className="p-3 uppercase font-semibold text-blue-700">{p.planId}</td>
                      <td className="p-3 capitalize">{p.billingCycle}</td>
                      <td className="p-3 font-bold text-slate-900">{p.amountMAD} MAD</td>
                      <td className="p-3 uppercase">{p.provider}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.status === 'completed' ? 'Confirmé' : 'En attente'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Child Modal */}
      {isAddChildOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Inscrire un Nouvel Élève</h3>
            <form onSubmit={handleAddChild} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Amine El Amrani"
                  value={newChildName}
                  onChange={e => setNewChildName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Classe</label>
                <select
                  value={newChildGrade}
                  onChange={e => setNewChildGrade(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                >
                  <option value="5ème Année Primaire (CM1)">5ème Année Primaire (CM1)</option>
                  <option value="6ème Année Primaire (CM2)">6ème Année Primaire (CM2)</option>
                  <option value="1ère Année Collège (1AC)">1ère Année Collège (1AC)</option>
                  <option value="2ème Année Collège (2AC)">2ème Année Collège (2AC)</option>
                  <option value="3ème Année Collège (3AC / Brevet)">3ème Année Collège (3AC / Brevet)</option>
                  <option value="Tronc Commun Scientifique">Tronc Commun Scientifique</option>
                  <option value="1ère Bac Sciences Math / Exp">1ère Bac Sciences Math / Exp</option>
                  <option value="2ème Bac Sciences Math / PC / SVT">2ème Bac Sciences Math / PC / SVT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Programme</label>
                <select
                  value={newChildCurriculum}
                  onChange={e => setNewChildCurriculum(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                >
                  <option value="moroccan-biof">Marocain International (BIOF - Français)</option>
                  <option value="moroccan-national">Marocain National Général (Arabe)</option>
                  <option value="french-mission">Mission Française (AEFE)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddChildOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                >
                  Ajouter l'Élève
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={Boolean(selectedPlanForCheckout)}
        onClose={() => setSelectedPlanForCheckout(null)}
        selectedPlan={selectedPlanForCheckout}
        onSuccess={() => {
          refreshUser();
        }}
      />
    </div>
  );
};

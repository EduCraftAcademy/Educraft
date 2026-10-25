import React, { useState, useEffect } from 'react';
import { adminApi, subscriptionApi } from '../api/client';
import { User, SubscriptionPlan, TeacherSalaryPayment } from '../types';
import {
  Shield,
  Users,
  CreditCard,
  Landmark,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Activity,
  Calendar,
  Search,
  Check,
  X,
  Edit2,
  Send,
  Cpu,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'salaries' | 'plans' | 'transfers' | 'ai'>('metrics');
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<TeacherSalaryPayment[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState('');

  // AI Configuration State
  const [aiConfig, setAiConfig] = useState<any>({
    provider: 'gemini',
    geminiModel: 'gemini-flash-lite-latest',
    openrouterModel: 'qwen/qwen-2.5-72b-instruct:free',
    openrouterApiKey: '',
    temperature: 0.3,
  });
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [testingAI, setTestingAI] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [savingAI, setSavingAI] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Edit salary modal
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [newSalaryMAD, setNewSalaryMAD] = useState<number>(12000);

  // Edit plan modal
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planMonthlyMAD, setPlanMonthlyMAD] = useState<number>(0);
  const [planQuarterlyMAD, setPlanQuarterlyMAD] = useState<number>(0);
  const [planYearlyMAD, setPlanYearlyMAD] = useState<number>(0);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    adminApi.getMetrics().then(res => {
      if (res.success) setMetrics(res.metrics);
    });

    adminApi.getUsers().then(res => {
      if (res.success) setUsers(res.users);
    });

    adminApi.getSalaries().then(res => {
      if (res.success) {
        setTeachers(res.teachers);
        setSalaryHistory(res.history);
      }
    });

    subscriptionApi.getPlans().then(res => {
      if (res.success) setPlans(res.plans);
    });

    subscriptionApi.getHistory().then(res => {
      if (res.success) setPayments(res.payments);
    });

    adminApi.getAIConfig().then(res => {
      if (res.success) {
        setAiConfig(res.config);
        setAiStatus(res.status);
      }
    }).catch(err => console.error('Failed to load AI config:', err));
  };

  const handleSaveAIConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAI(true);
    setSaveSuccessMsg(null);
    setTestError(null);
    try {
      const res = await adminApi.updateAIConfig(aiConfig);
      if (res.success) {
        setAiConfig(res.config);
        setAiStatus(res.status);
        setSaveSuccessMsg('Configuration IA enregistrée et activée immédiatement.');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setTestError(err.message || 'Erreur lors de la sauvegarde de la configuration IA.');
    } finally {
      setSavingAI(false);
    }
  };

  const handleTestAIConnection = async () => {
    setTestingAI(true);
    setTestResult(null);
    setTestError(null);
    try {
      const res = await adminApi.testAIConnection(aiConfig);
      if (res.success) {
        setTestResult(res.message);
      }
    } catch (err: any) {
      setTestError(err.message || 'Échec du test de connexion avec le modèle.');
    } finally {
      setTestingAI(false);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    await adminApi.setUserStatus(user.id, newStatus);
    loadAll();
  };

  const handleUpdateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    await adminApi.updateSalary(editingTeacher.id, Number(newSalaryMAD));
    setEditingTeacher(null);
    loadAll();
  };

  const handlePaySalary = async (teacherId: string, amountMAD: number) => {
    if (!confirm('Confirmer l\'enregistrement du virement de salaire ?')) return;
    await adminApi.paySalary({
      teacherId,
      amountMAD,
    });
    alert('Virement de salaire enregistré avec succès !');
    loadAll();
  };

  const handleUpdatePlanPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    await adminApi.updatePlanPrice({
      planId: editingPlan.id,
      monthlyPriceMAD: Number(planMonthlyMAD),
      quarterlyPriceMAD: Number(planQuarterlyMAD),
      yearlyPriceMAD: Number(planYearlyMAD),
    });
    setEditingPlan(null);
    loadAll();
  };

  const handleApproveTransfer = async (txId: string) => {
    if (!confirm('Valider la réception des fonds et activer l\'abonnement ?')) return;
    const res = await adminApi.approveTransfer(txId);
    if (res.success) {
      alert('Virement validé avec succès ! Abonnement activé.');
      loadAll();
    }
  };

  const filteredUsers = users.filter(
    u =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.role.toLowerCase().includes(searchUser.toLowerCase())
  );

  const pendingTransfers = payments.filter(p => p.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Console Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs uppercase px-2 py-0.5">
              Plateforme EduCraft AI
            </span>
            <span className="text-xs text-slate-300">Console d'Administration & Direction</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black">Gestion Stratégique & Opérationnelle</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Supervisez la masse salariale fixe des professeurs, les revenus récurrents en Dirhams (MAD), les élèves inscrits et les passerelles techniques.
          </p>
        </div>

        {metrics && (
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-xs space-y-1.5 shrink-0">
            <div className="text-slate-400">Marge Brute Opérationnelle Estimée :</div>
            <div className="text-2xl font-black text-emerald-400">
              {metrics.estimatedGrossMarginMAD.toLocaleString('fr-FR')} MAD / mois
            </div>
            <div className="text-[11px] text-slate-400">
              MRR : {metrics.estimatedMRRMAD} MAD • Masse Salariale : {metrics.totalTeacherPayrollMAD} MAD
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'metrics' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Vue d'Ensemble & Budget
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'users' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" /> Utilisateurs ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('salaries')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'salaries' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Landmark className="w-4 h-4" /> Salaires Enseignants ({teachers.length})
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'plans' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Forfaits & Tarifs MAD
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 relative ${
            activeTab === 'transfers' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <CheckCircle className="w-4 h-4" /> Virements en Attente
          {pendingTransfers.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
              {pendingTransfers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'ai' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Cpu className="w-4 h-4" /> Moteur IA & Modèles
        </button>
      </div>

      {/* TAB 1: METRICS & BUDGET */}
      {activeTab === 'metrics' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-bold uppercase">Revenus Mensuels (MRR)</span>
              <div className="text-2xl font-black text-blue-900">
                {metrics.estimatedMRRMAD.toLocaleString('fr-FR')} MAD
              </div>
              <span className="text-[11px] text-slate-500">Estimé sur abonnements actifs</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-bold uppercase">Masse Salariale Enseignants</span>
              <div className="text-2xl font-black text-red-600">
                {metrics.totalTeacherPayrollMAD.toLocaleString('fr-FR')} MAD
              </div>
              <span className="text-[11px] text-slate-500">Obligation mensuelle fixe</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-bold uppercase">Élèves Enregistrés</span>
              <div className="text-2xl font-black text-slate-900">{metrics.totalStudents} élèves</div>
              <span className="text-[11px] text-emerald-600 font-semibold">
                {metrics.activePaidStudents} abonnés payants
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-bold uppercase">Enseignants Salariés</span>
              <div className="text-2xl font-black text-slate-900">{metrics.totalTeachers} professeurs</div>
              <span className="text-[11px] text-blue-600 font-semibold">{metrics.totalClasses} cours planifiés</span>
            </div>
          </div>

          {/* Budget Planning Explainer */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Landmark className="w-5 h-5 text-blue-600" />
              Simulateur d'Équilibre Budgétaire EduCraft Maroc
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              EduCraft emploie des enseignants en CDI/contrat fixe afin de garantir un accompagnement stable aux familles. Le modèle économique repose sur la couverture de la masse salariale ({metrics.totalTeacherPayrollMAD} MAD/mois) par les forfaits étudiants groupés (de 149 à 700 MAD/mois).
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900 text-base">Annuaire des Comptes</h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher nom, email, rôle..."
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Utilisateur</th>
                  <th className="p-3">Rôle</th>
                  <th className="p-3">Détail Spécifique</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">
                      {u.role === 'student'
                        ? `${u.studentProfile?.grade} (${u.studentProfile?.subscriptionPlanId.toUpperCase()})`
                        : u.role === 'teacher'
                        ? `${u.teacherProfile?.subjectsTaught.join(', ')} • ${u.teacherProfile?.monthlySalaryMAD} MAD/m`
                        : '—'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.status === 'active' ? 'Actif' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {u.role !== 'owner' && (
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`text-xs font-bold px-3 py-1 rounded-lg transition ${
                            u.status === 'active'
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspendre' : 'Réactiver'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TEACHER SALARIES */}
      {activeTab === 'salaries' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-600" />
              Grille Salariale des Enseignants Employés (MAD)
            </h3>
            <p className="text-xs text-slate-500">
              Configuration confidentielle réservée à l'administration. Chaque enseignant reçoit un salaire mensuel fixe déterminé par contrat.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Enseignant</th>
                    <th className="p-3">Matières</th>
                    <th className="p-3">Type de Contrat</th>
                    <th className="p-3">Salaire Fixe Mensuel</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {teachers.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/80">
                      <td className="p-3">
                        <strong className="text-slate-900">{t.name}</strong>
                        <span className="block text-[11px] text-slate-500">{t.email}</span>
                      </td>
                      <td className="p-3 text-slate-600">{t.subjects.join(', ')}</td>
                      <td className="p-3 capitalize">{t.employmentStatus.replace('_', ' ')}</td>
                      <td className="p-3 font-extrabold text-blue-900 text-sm">
                        {t.monthlySalaryMAD.toLocaleString('fr-FR')} MAD / mois
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingTeacher(t);
                            setNewSalaryMAD(t.monthlySalaryMAD);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          Modifier Salaire
                        </button>
                        <button
                          onClick={() => handlePaySalary(t.id, t.monthlySalaryMAD)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                        >
                          Enregistrer Virement
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUBSCRIPTION PLANS PRICING */}
      {activeTab === 'plans' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Tarification Officielle des Forfaits (MAD)</h3>
          <p className="text-xs text-slate-500">
            Ajustez les prix en Dirhams Marocains pour chaque cycle de facturation. Les forfaits sont immédiatement mis à jour pour les utilisateurs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(p => (
              <div key={p.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm">{p.name}</h4>
                  <button
                    onClick={() => {
                      setEditingPlan(p);
                      setPlanMonthlyMAD(p.monthlyPriceMAD);
                      setPlanQuarterlyMAD(p.quarterlyPriceMAD);
                      setPlanYearlyMAD(p.yearlyPriceMAD);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Modifier les prix"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span>Mensuel :</span>
                    <strong>{p.monthlyPriceMAD} MAD</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Trimestriel :</span>
                    <strong>{p.quarterlyPriceMAD} MAD</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Annuel :</span>
                    <strong>{p.yearlyPriceMAD} MAD</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                  Cours live : {p.liveClassesPerMonth}/m • Max élèves : {p.maxStudentsPerClass}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PENDING BANK TRANSFERS */}
      {activeTab === 'transfers' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-amber-600" />
            Vérification des Virements Bancaires Hors-Ligne
          </h3>
          <p className="text-xs text-slate-500">
            Validez la réception des fonds sur le compte CIH / BMCE / Attijariwafa pour débloquer l'accès aux cours de l'élève.
          </p>

          {pendingTransfers.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              Aucun virement bancaire en attente de validation.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Réf Virement</th>
                    <th className="p-3">Forfait</th>
                    <th className="p-3">Période</th>
                    <th className="p-3">Montant</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {pendingTransfers.map(pt => (
                    <tr key={pt.id}>
                      <td className="p-3 font-mono font-bold text-slate-900">{pt.reference}</td>
                      <td className="p-3 uppercase font-semibold text-blue-700">{pt.planId}</td>
                      <td className="p-3 capitalize">{pt.billingCycle}</td>
                      <td className="p-3 font-black text-slate-900">{pt.amountMAD} MAD</td>
                      <td className="p-3 text-slate-500">{new Date(pt.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleApproveTransfer(pt.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
                        >
                          Valider le Virement
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AI ENGINE & MODEL CONFIGURATION */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  Configuration du Moteur d'Intelligence Artificielle
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sélectionnez le fournisseur d'IA et le modèle exact utilisé pour la génération pédagogique des cours, diapositives et quiz.
                </p>
              </div>

              {aiStatus && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    (aiStatus.activeProvider === 'gemini' && aiStatus.geminiConfigured) ||
                    (aiStatus.activeProvider === 'openrouter' && aiStatus.openrouterConfigured)
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    Moteur Actif : {aiStatus.activeProvider === 'gemini' ? 'Google Gemini' : 'OpenRouter'} ({aiStatus.activeModel})
                  </span>
                </div>
              )}
            </div>

            {/* Success and Error Alerts */}
            {saveSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {testResult && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
                <span>{testResult}</span>
              </div>
            )}

            {testError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{testError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAIConfig} className="space-y-6">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Fournisseur d'IA Actif
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                      aiConfig.provider === 'gemini'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="provider"
                      value="gemini"
                      checked={aiConfig.provider === 'gemini'}
                      onChange={() => setAiConfig({ ...aiConfig, provider: 'gemini' })}
                      className="mt-1 w-4 h-4 text-indigo-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        Google Gemini
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm bg-indigo-100 text-indigo-800">
                          Recommandé
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Utilise le SDK officiel Google GenAI côté serveur avec la clé injectée sécurisée.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                      aiConfig.provider === 'openrouter'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="provider"
                      value="openrouter"
                      checked={aiConfig.provider === 'openrouter'}
                      onChange={() => setAiConfig({ ...aiConfig, provider: 'openrouter' })}
                      className="mt-1 w-4 h-4 text-indigo-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">OpenRouter (Multi-modèles)</div>
                      <p className="text-xs text-slate-500 mt-1">
                        Accès à Qwen, Claude, LLaMA, DeepSeek et Mistral via l'API OpenRouter.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Gemini Provider Settings */}
              {aiConfig.provider === 'gemini' && (
                <div className="p-5 rounded-xl border border-indigo-100 bg-slate-50 space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm">Paramètres Google Gemini</h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Identifiant du Modèle Gemini
                    </label>
                    <input
                      type="text"
                      value={aiConfig.geminiModel || ''}
                      onChange={e => setAiConfig({ ...aiConfig, geminiModel: e.target.value })}
                      placeholder="gemini-flash-lite-latest"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                    />
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[11px] text-slate-500">Modèles recommandés :</span>
                      <button
                        type="button"
                        onClick={() => setAiConfig({ ...aiConfig, geminiModel: 'gemini-flash-lite-latest' })}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-indigo-700 hover:bg-indigo-50"
                      >
                        gemini-flash-lite-latest (Rapide & Stable)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiConfig({ ...aiConfig, geminiModel: 'gemini-3.8-flash' })}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-indigo-700 hover:bg-indigo-50"
                      >
                        gemini-3.8-flash (Haute Précision)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* OpenRouter Provider Settings */}
              {aiConfig.provider === 'openrouter' && (
                <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm">Paramètres OpenRouter</h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Modèle OpenRouter
                    </label>
                    <input
                      type="text"
                      value={aiConfig.openrouterModel || ''}
                      onChange={e => setAiConfig({ ...aiConfig, openrouterModel: e.target.value })}
                      placeholder="qwen/qwen-2.5-72b-instruct:free"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                    />
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[11px] text-slate-500">Modèles populaires :</span>
                      <button
                        type="button"
                        onClick={() => setAiConfig({ ...aiConfig, openrouterModel: 'qwen/qwen-2.5-72b-instruct:free' })}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      >
                        qwen/qwen-2.5-72b-instruct:free
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiConfig({ ...aiConfig, openrouterModel: 'meta-llama/llama-3.3-70b-instruct' })}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      >
                        meta-llama/llama-3.3-70b-instruct
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Clé API OpenRouter (Optionnel si définie dans .env)
                    </label>
                    <input
                      type="password"
                      value={aiConfig.openrouterApiKey || ''}
                      onChange={e => setAiConfig({ ...aiConfig, openrouterApiKey: e.target.value })}
                      placeholder="sk-or-v1-..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                </div>
              )}

              {/* Temperature Slider */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase">
                  <span>Créativité & Rigueur Pédagogique (Température)</span>
                  <span className="text-indigo-600 font-mono text-sm">{aiConfig.temperature ?? 0.3}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={aiConfig.temperature ?? 0.3}
                  onChange={e => setAiConfig({ ...aiConfig, temperature: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0.0 : Rigueur stricte (Exactitude mathématique)</span>
                  <span>0.5 : Équilibré</span>
                  <span>1.0 : Créativité maximale</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestAIConnection}
                  disabled={testingAI}
                  className="px-4 py-2.5 rounded-xl border border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-bold text-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {testingAI ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      Test en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Tester la Connexion au Modèle
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={savingAI}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {savingAI ? 'Enregistrement...' : 'Enregistrer la Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Edit Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Modifier Salaire : {editingTeacher.name}</h3>
            <form onSubmit={handleUpdateSalary} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Salaire Net Mensuel (MAD)</label>
                <input
                  type="number"
                  step="500"
                  required
                  value={newSalaryMAD}
                  onChange={e => setNewSalaryMAD(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Price Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Modifier Tarifs : {editingPlan.name}</h3>
            <form onSubmit={handleUpdatePlanPricing} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Prix Mensuel (MAD)</label>
                <input
                  type="number"
                  required
                  value={planMonthlyMAD}
                  onChange={e => setPlanMonthlyMAD(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Prix Trimestriel (MAD)</label>
                <input
                  type="number"
                  required
                  value={planQuarterlyMAD}
                  onChange={e => setPlanQuarterlyMAD(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Prix Annuel (MAD)</label>
                <input
                  type="number"
                  required
                  value={planYearlyMAD}
                  onChange={e => setPlanYearlyMAD(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

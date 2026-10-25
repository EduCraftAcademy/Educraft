import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscriptionApi } from '../api/client';
import { SubscriptionPlan } from '../types';
import { CheckoutModal } from '../components/CheckoutModal';
import {
  Check,
  CreditCard,
  Sparkles,
  Users,
  Video,
  ShieldCheck,
  Zap,
  HelpCircle,
} from 'lucide-react';

export const SubscriptionsView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    subscriptionApi.getPlans().then(res => {
      if (res.success) setPlans(res.plans);
    });
  }, []);

  const getPrice = (plan: SubscriptionPlan) => {
    if (billingCycle === 'yearly') return plan.yearlyPriceMAD;
    if (billingCycle === 'quarterly') return plan.quarterlyPriceMAD;
    return plan.monthlyPriceMAD;
  };

  const currentPlanId = user?.studentProfile?.subscriptionPlanId || 'free';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Title Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
          Transparence & Tarification Accessible
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Forfaits Scolaires Tout Compris (MAD)
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Les élèves s'abonnent à un forfait global incluant l'ensemble des matières de leur cycle.
          Pas d'achat matière par matière.
        </p>

        {/* Billing Cycle Switcher */}
        <div className="pt-4 flex items-center justify-center">
          <div className="inline-flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                billingCycle === 'monthly' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle('quarterly')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                billingCycle === 'quarterly' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trimestriel (3 mois)
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                Éco
              </span>
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                billingCycle === 'yearly' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annuel (12 mois)
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-bold">
                -20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Plans Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-stretch">
        {plans.map(plan => {
          const price = getPrice(plan);
          const isCurrent = currentPlanId === plan.id;
          const isVip = plan.id === 'vip';
          const isPopular = plan.popular;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 ${
                isPopular
                  ? 'bg-linear-to-b from-blue-900 to-indigo-950 text-white shadow-2xl scale-102 border-2 border-blue-400'
                  : isVip
                  ? 'bg-linear-to-b from-slate-900 to-slate-950 text-white border-2 border-amber-400/80 shadow-xl'
                  : 'bg-white border border-slate-200 shadow-xs hover:border-blue-300 text-slate-900'
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                  Le Plus Populaire
                </span>
              )}

              {isVip && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                  Prestige VIP
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black">{price}</span>
                    <span className="text-xs font-bold">MAD</span>
                    <span className={`text-[11px] ml-1 ${isPopular || isVip ? 'text-slate-300' : 'text-slate-500'}`}>
                      / {billingCycle === 'monthly' ? 'mois' : billingCycle === 'quarterly' ? 'trimestre' : 'an'}
                    </span>
                  </div>
                </div>

                {/* Live Classes specs */}
                <div
                  className={`p-3 rounded-xl text-xs space-y-1 ${
                    isPopular || isVip ? 'bg-white/10' : 'bg-slate-50'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-red-400" />
                    {plan.liveClassesPerMonth > 0
                      ? `${plan.liveClassesPerMonth} cours en direct / mois`
                      : 'Aucun cours en direct'}
                  </div>
                  {plan.maxStudentsPerClass > 0 && (
                    <div className="text-[11px] opacity-80">
                      Capacité : Max {plan.maxStudentsPerClass} élèves / classe
                    </div>
                  )}
                  {plan.makeupClassesPerMonth > 0 && (
                    <div className="text-[11px] text-amber-300 font-bold">
                      {plan.makeupClassesPerMonth} cours de rattrapage / mois
                    </div>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-2 text-xs">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isPopular || isVip ? 'text-cyan-400' : 'text-blue-600'}`} />
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                {plan.id === 'free' ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 cursor-not-allowed"
                  >
                    {isCurrent ? 'Forfait Actuel' : 'Inclus d\'office'}
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedPlanForCheckout(plan)}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                      isPopular
                        ? 'bg-blue-500 hover:bg-blue-400 text-white'
                        : isVip
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isCurrent ? 'Renouveler ce Forfait' : 'Choisir ce Forfait'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Important Clarification Note */}
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-2 text-xs text-slate-700">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          Règles d'Attribution & Période de Grâce
        </h4>
        <p className="leading-relaxed">
          • <strong>Total Mensuel Global :</strong> Les 12 cours VIP (ou 8 cours Premium, 4 cours Plus) représentent le total mensuel réparti sur l'ensemble des matières de l'élève, et non par matière ni par semaine.
        </p>
        <p className="leading-relaxed">
          • <strong>Période de grâce de 3 jours :</strong> À l'expiration d'un forfait payant, l'élève conserve son accès pendant 3 jours ouvrés pour permettre le règlement. Après ce délai, les cours en direct sont mis en pause. <em>Vos notes, devoirs et historiques ne sont jamais supprimés.</em>
        </p>
      </div>

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

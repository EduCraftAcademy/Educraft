import React, { useState } from 'react';
import { SubscriptionPlan } from '../types';
import { useAuth } from '../context/AuthContext';
import { subscriptionApi } from '../api/client';
import { X, CreditCard, Landmark, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: SubscriptionPlan | null;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  onSuccess,
}) => {
  const { user, childrenList, refreshUser } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'cmi' | 'bank_transfer'>('cmi');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [bankName, setBankName] = useState<string>('CIH Bank');
  const [transferRef, setTransferRef] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Default student selection
  React.useEffect(() => {
    if (childrenList.length > 0) {
      setSelectedStudentId(childrenList[0].id);
    } else if (user?.role === 'student') {
      setSelectedStudentId(user.id);
    }
  }, [childrenList, user]);

  if (!isOpen || !selectedPlan) return null;

  const currentPrice =
    billingCycle === 'yearly'
      ? selectedPlan.yearlyPriceMAD
      : billingCycle === 'quarterly'
      ? selectedPlan.quarterlyPriceMAD
      : selectedPlan.monthlyPriceMAD;

  const handleProcessPayment = async () => {
    setError(null);
    setLoading(true);

    try {
      const studentId = selectedStudentId || user?.id;
      if (!studentId) {
        throw new Error('Veuillez sélectionner l\'élève bénéficiaire de l\'abonnement.');
      }

      if (paymentMethod === 'cmi') {
        // Step 1: Create pending order
        const checkoutRes = await subscriptionApi.checkout({
          studentId,
          planId: selectedPlan.id,
          billingCycle,
          provider: 'cmi',
        });

        // Step 2: Confirm via secure gateway simulation
        const confirmRes = await subscriptionApi.confirmPayment(checkoutRes.order.id);
        if (confirmRes.success) {
          setSuccessMessage(`Abonnement ${selectedPlan.name} activé avec succès pour ${confirmRes.transaction.amountMAD} MAD !`);
          await refreshUser();
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        }
      } else {
        // Bank transfer workflow
        if (!transferRef.trim()) {
          throw new Error('Veuillez saisir le numéro ou la référence de votre virement bancaire.');
        }

        const btRes = await subscriptionApi.submitBankTransfer({
          studentId,
          planId: selectedPlan.id,
          billingCycle,
          bankName,
          transferReference: transferRef.trim(),
        });

        if (btRes.success) {
          setSuccessMessage('Virement enregistré avec succès ! L\'accès sera validé par l\'administration sous 24h.');
          await refreshUser();
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la souscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Souscription : {selectedPlan.name}</h3>
            <p className="text-xs text-slate-300">Paiement sécurisé en Dirhams Marocains (MAD)</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              {successMessage}
            </div>
          )}

          {/* Student Selector (If parent has multiple children) */}
          {childrenList.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Élève bénéficiaire
              </label>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-blue-600"
              >
                {childrenList.map(ch => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name} — {ch.studentProfile?.grade}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Billing Cycle Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Période de facturation
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`p-3 rounded-xl border text-center transition ${
                  billingCycle === 'monthly'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="text-xs">Mensuel</div>
                <div className="text-sm font-extrabold mt-0.5">{selectedPlan.monthlyPriceMAD} MAD</div>
                <div className="text-[10px] text-slate-500">1 mois</div>
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle('quarterly')}
                className={`p-3 rounded-xl border text-center transition ${
                  billingCycle === 'quarterly'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="text-xs">Trimestriel</div>
                <div className="text-sm font-extrabold mt-0.5">{selectedPlan.quarterlyPriceMAD} MAD</div>
                <div className="text-[10px] text-emerald-600 font-semibold">Économie 3 mois</div>
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`p-3 rounded-xl border text-center transition ${
                  billingCycle === 'yearly'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="text-xs">Annuel</div>
                <div className="text-sm font-extrabold mt-0.5">{selectedPlan.yearlyPriceMAD} MAD</div>
                <div className="text-[10px] text-emerald-600 font-semibold">Meilleur tarif</div>
              </button>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Moyen de paiement
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cmi')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition text-left ${
                  paymentMethod === 'cmi'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <div className="text-xs">Carte Bancaire CMI</div>
                  <div className="text-[10px] text-slate-500">Validation immédiate</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition text-left ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <Landmark className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs">Virement Bancaire</div>
                  <div className="text-[10px] text-slate-500">CIH / Attijari / BMCE</div>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Method Details */}
          {paymentMethod === 'cmi' ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Passerelle Bancaire Marocaine Sécurisée (SSL 256-bit)
              </div>
              <p>
                Mode Sandbox actif : En cliquant sur « Confirmer et Payer », la transaction de <strong>{currentPrice} MAD</strong> sera traitée et l'abonnement activé immédiatement sur le serveur.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3 text-xs text-emerald-950">
              <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                <Landmark className="w-4 h-4" /> Coordonnées Bancaires Officielles EduCraft Maroc
              </div>
              <div className="bg-white p-3 rounded-lg border border-emerald-300 text-[11px] space-y-1 font-mono">
                <div>Banque : <strong>CIH Bank Maroc</strong></div>
                <div>Titulaire : <strong>EDUCRAFT SARL</strong></div>
                <div>RIB : <strong>230 780 0001234567890123 45</strong></div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700">
                  Référence ou N° d'opération de votre virement :
                </label>
                <input
                  type="text"
                  placeholder="Ex: VIR-2026-94812"
                  value={transferRef}
                  onChange={e => setTransferRef(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>
          )}

          {/* Total Summary */}
          <div className="p-4 bg-slate-100 rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Total à régler :</span>
            <div className="text-right">
              <span className="text-xl font-extrabold text-blue-900">{currentPrice} MAD</span>
              <span className="block text-[10px] text-slate-500">Toutes taxes comprises</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleProcessPayment}
            disabled={loading || Boolean(successMessage)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Traitement sécurisé...' : `Confirmer et Payer (${currentPrice} MAD)`}
          </button>
        </div>
      </div>
    </div>
  );
};

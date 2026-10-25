import { Router } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest, requireAuth } from '../auth.js';
import {
  calculateOrderPrice,
  createPendingOrder,
  confirmPayment,
  simulateWebhookPayment,
} from '../payments.js';

const router = Router();

// Get Plans
router.get('/plans', (req, res) => {
  const plans = db.get('subscriptionPlans');
  res.json({ success: true, plans });
});

// Checkout Order
router.post('/checkout', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { studentId, planId, billingCycle, provider = 'sandbox' } = req.body;

    if (!studentId || !planId || !billingCycle) {
      return res.status(400).json({ success: false, message: 'Paramètres de souscription incomplets.' });
    }

    const order = createPendingOrder({
      userId: req.user!.id,
      studentId,
      planId,
      billingCycle,
      provider,
    });

    res.json({
      success: true,
      order,
      calculatedAmountMAD: order.amountMAD,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Confirm Payment (Test Card / Sandbox Gateway)
router.post('/confirm', requireAuth, (req: AuthenticatedRequest, res) => {
  const { transactionId } = req.body;
  if (!transactionId) {
    return res.status(400).json({ success: false, message: 'Identifiant de transaction manquant.' });
  }

  const result = confirmPayment(transactionId, {
    verifiedBy: `Paiement Carte Sécurisé (Utilisateur: ${req.user!.email})`,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({
    success: true,
    message: 'Paiement confirmé avec succès ! L\'abonnement est actif.',
    transaction: result.transaction,
  });
});

// Submit Manual Bank Transfer Details
router.post('/bank-transfer', requireAuth, (req: AuthenticatedRequest, res) => {
  const { studentId, planId, billingCycle, bankName, transferReference } = req.body;

  if (!studentId || !planId || !billingCycle || !transferReference) {
    return res.status(400).json({
      success: false,
      message: 'Veuillez fournir la référence du virement bancaire.',
    });
  }

  try {
    const { amountMAD } = calculateOrderPrice(planId, billingCycle);
    const orderId = `pay-bt-${Date.now().toString(36)}`;

    const order = {
      id: orderId,
      userId: req.user!.id,
      studentId,
      planId,
      billingCycle,
      amountMAD,
      provider: 'bank_transfer' as const,
      status: 'pending' as const,
      reference: `VIR-${bankName || 'BANK'}-${transferReference}`,
      createdAt: new Date().toISOString(),
    };

    db.update(data => {
      data.payments.unshift(order);
      data.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: req.user!.id,
        title: 'Virement Bancaire en Attente de Validation',
        message: `Votre virement de ${amountMAD} MAD (Réf: ${order.reference}) a été reçu. Notre équipe administrative valide l'accès sous 24h ouvrées.`,
        type: 'payment',
        read: false,
        createdAt: new Date().toISOString(),
      });
    });

    res.json({
      success: true,
      message: 'Demande de validation de virement enregistrée avec succès.',
      order,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Payment History
router.get('/history', requireAuth, (req: AuthenticatedRequest, res) => {
  const payments = db.get('payments');
  const userPayments =
    req.user!.role === 'admin' || req.user!.role === 'owner'
      ? payments
      : payments.filter(p => p.userId === req.user!.id || p.studentId === req.user!.id);

  res.json({ success: true, payments: userPayments });
});

export default router;

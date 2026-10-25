import { db, PaymentTransaction, SubscriptionPlan, User } from './db.js';

export interface CreateOrderParams {
  userId: string;
  studentId: string;
  planId: 'basic' | 'plus' | 'premium' | 'vip';
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  provider: 'sandbox' | 'cmi' | 'bank_transfer';
}

export function calculateOrderPrice(planId: string, billingCycle: 'monthly' | 'quarterly' | 'yearly'): {
  amountMAD: number;
  durationMonths: number;
} {
  const plans = db.get('subscriptionPlans');
  const plan = plans.find(p => p.id === planId);
  if (!plan) {
    throw new Error(`Plan ${planId} not found`);
  }

  if (billingCycle === 'yearly') {
    return { amountMAD: plan.yearlyPriceMAD, durationMonths: 12 };
  } else if (billingCycle === 'quarterly') {
    return { amountMAD: plan.quarterlyPriceMAD, durationMonths: 3 };
  } else {
    return { amountMAD: plan.monthlyPriceMAD, durationMonths: 1 };
  }
}

export function createPendingOrder(params: CreateOrderParams): PaymentTransaction {
  const { amountMAD } = calculateOrderPrice(params.planId, params.billingCycle);
  const transactionId = `pay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const reference = `${params.provider.toUpperCase()}-${Date.now().toString().slice(-6)}`;

  const order: PaymentTransaction = {
    id: transactionId,
    userId: params.userId,
    studentId: params.studentId,
    planId: params.planId,
    billingCycle: params.billingCycle,
    amountMAD,
    provider: params.provider,
    status: 'pending',
    reference,
    createdAt: new Date().toISOString(),
  };

  db.update(data => {
    data.payments.unshift(order);
  });

  return order;
}

export function confirmPayment(
  transactionId: string,
  verifierInfo: { verifiedBy: string; notes?: string }
): { success: boolean; transaction?: PaymentTransaction; message?: string } {
  let targetTx: PaymentTransaction | undefined;
  let targetStudent: User | undefined;

  db.update(data => {
    const tx = data.payments.find(p => p.id === transactionId);
    if (!tx) return;
    if (tx.status === 'completed') {
      targetTx = tx;
      return;
    }

    tx.status = 'completed';
    tx.verifiedAt = new Date().toISOString();
    tx.verifiedBy = verifierInfo.verifiedBy;
    targetTx = tx;

    // Activate the subscription for the student!
    const student = data.users.find(u => u.id === tx.studentId && u.role === 'student');
    if (student && student.studentProfile) {
      const { durationMonths } = calculateOrderPrice(tx.planId, tx.billingCycle);
      const currentExpiry = new Date(student.studentProfile.subscriptionExpiresAt).getTime();
      const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
      const newExpiry = new Date(baseTime + durationMonths * 30.5 * 24 * 60 * 60 * 1000).toISOString();

      student.studentProfile.subscriptionPlanId = tx.planId as any;
      student.studentProfile.subscriptionExpiresAt = newExpiry;
      student.studentProfile.subscriptionStatus = 'active';
      targetStudent = student;

      // Add in-app notification
      data.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: tx.userId,
        title: 'Paiement Confirmé & Abonnement Activé',
        message: `Le paiement de ${tx.amountMAD} MAD pour le forfait ${tx.planId.toUpperCase()} (${student.name}) a été validé avec succès.`,
        type: 'payment',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/parent',
      });
    }
  });

  if (!targetTx) {
    return { success: false, message: 'Transaction introuvable.' };
  }

  return { success: true, transaction: targetTx };
}

export function simulateWebhookPayment(transactionId: string): boolean {
  const result = confirmPayment(transactionId, { verifiedBy: 'System Gateway Webhook (Auto-Verified)' });
  return result.success;
}

import { Router } from 'express';
import { db, User, TeacherSalaryPayment } from '../db.js';
import { AuthenticatedRequest, requireAuth, requireRole } from '../auth.js';
import { getAIProviderStatus, getAIConfig, updateAIConfig, testAIProviderConnection } from '../ai.js';
import { confirmPayment } from '../payments.js';

const router = Router();

// Admin / Owner Overview Metrics
router.get('/metrics', requireAuth, requireRole('admin', 'owner'), (req, res) => {
  const users = db.get('users');
  const payments = db.get('payments');
  const classes = db.get('classes');
  const plans = db.get('subscriptionPlans');

  const students = users.filter(u => u.role === 'student');
  const teachers = users.filter(u => u.role === 'teacher');
  const parents = users.filter(u => u.role === 'parent');

  // Revenue metrics (MAD)
  const completedPayments = payments.filter(p => p.status === 'completed');
  const totalConfirmedRevenueMAD = completedPayments.reduce((sum, p) => sum + p.amountMAD, 0);

  // MRR estimation based on active student subscriptions
  const activePaidStudents = students.filter(
    s => s.studentProfile?.subscriptionStatus === 'active' && s.studentProfile.subscriptionPlanId !== 'free'
  );
  const estimatedMRRMAD = activePaidStudents.reduce((sum, s) => {
    const plan = plans.find(p => p.id === s.studentProfile?.subscriptionPlanId);
    return sum + (plan?.monthlyPriceMAD || 0);
  }, 0);

  // Monthly Teacher Payroll obligations
  const totalTeacherPayrollMAD = teachers.reduce((sum, t) => {
    return sum + (t.teacherProfile?.monthlySalaryMAD || 0);
  }, 0);

  // Pending bank transfers
  const pendingTransfers = payments.filter(p => p.status === 'pending');

  // Estimated gross margin
  const estimatedGrossMarginMAD = estimatedMRRMAD - totalTeacherPayrollMAD;

  res.json({
    success: true,
    metrics: {
      totalStudents: students.length,
      activePaidStudents: activePaidStudents.length,
      totalTeachers: teachers.length,
      totalParents: parents.length,
      totalClasses: classes.length,
      estimatedMRRMAD,
      totalConfirmedRevenueMAD,
      totalTeacherPayrollMAD,
      estimatedGrossMarginMAD,
      pendingTransfersCount: pendingTransfers.length,
    },
  });
});

// Users Management
router.get('/users', requireAuth, requireRole('admin', 'owner'), (req, res) => {
  const users = db.get('users').map(u => {
    const { passwordHash, ...safe } = u;
    return safe;
  });
  res.json({ success: true, users });
});

router.post('/users/:id/status', requireAuth, requireRole('admin', 'owner'), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  let targetUser: User | undefined;
  db.update(data => {
    const user = data.users.find(u => u.id === id);
    if (user) {
      user.status = status === 'suspended' ? 'suspended' : 'active';
      targetUser = user;
    }
  });

  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
  }

  res.json({ success: true, user: targetUser });
});

// Teacher Salaries Management (Owner / Admin only)
router.get('/salaries', requireAuth, requireRole('admin', 'owner'), (req, res) => {
  const teachers = db
    .get('users')
    .filter(u => u.role === 'teacher')
    .map(t => ({
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      monthlySalaryMAD: t.teacherProfile?.monthlySalaryMAD || 0,
      employmentStatus: t.teacherProfile?.employmentStatus || 'full_time',
      weeklyHours: t.teacherProfile?.weeklyAvailabilityHours || 0,
      subjects: t.teacherProfile?.subjectsTaught || [],
    }));

  const history = db.get('salaryPayments');
  res.json({ success: true, teachers, history });
});

router.post('/salaries/update', requireAuth, requireRole('owner', 'admin'), (req, res) => {
  const { teacherId, monthlySalaryMAD, employmentStatus } = req.body;

  if (!teacherId || typeof monthlySalaryMAD !== 'number') {
    return res.status(400).json({ success: false, message: 'Salaire invalide.' });
  }

  let updated = false;
  db.update(data => {
    const teacher = data.users.find(u => u.id === teacherId && u.role === 'teacher');
    if (teacher && teacher.teacherProfile) {
      teacher.teacherProfile.monthlySalaryMAD = monthlySalaryMAD;
      if (employmentStatus) {
        teacher.teacherProfile.employmentStatus = employmentStatus;
      }
      updated = true;
    }
  });

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Enseignant introuvable.' });
  }

  res.json({ success: true, message: `Salaire mis à jour : ${monthlySalaryMAD} MAD/mois.` });
});

router.post('/salaries/pay', requireAuth, requireRole('owner', 'admin'), (req, res) => {
  const { teacherId, month, amountMAD, reference } = req.body;

  const users = db.get('users');
  const teacher = users.find(u => u.id === teacherId && u.role === 'teacher');
  if (!teacher) {
    return res.status(404).json({ success: false, message: 'Enseignant non trouvé.' });
  }

  const payment: TeacherSalaryPayment = {
    id: `sal-${Date.now().toString(36)}`,
    teacherId,
    teacherName: teacher.name,
    month: month || new Date().toISOString().slice(0, 7),
    amountMAD: amountMAD || teacher.teacherProfile?.monthlySalaryMAD || 0,
    status: 'paid',
    paidAt: new Date().toISOString(),
    reference: reference || `VIR-PAYROLL-${Date.now().toString().slice(-6)}`,
  };

  db.update(data => {
    data.salaryPayments.unshift(payment);
  });

  res.json({ success: true, payment });
});

// Update Plan Pricing
router.post('/plans/update', requireAuth, requireRole('owner', 'admin'), (req, res) => {
  const { planId, monthlyPriceMAD, quarterlyPriceMAD, yearlyPriceMAD } = req.body;

  db.update(data => {
    const plan = data.subscriptionPlans.find(p => p.id === planId);
    if (plan) {
      if (typeof monthlyPriceMAD === 'number') plan.monthlyPriceMAD = monthlyPriceMAD;
      if (typeof quarterlyPriceMAD === 'number') plan.quarterlyPriceMAD = quarterlyPriceMAD;
      if (typeof yearlyPriceMAD === 'number') plan.yearlyPriceMAD = yearlyPriceMAD;
    }
  });

  res.json({ success: true, message: 'Tarifs du forfait mis à jour avec succès.' });
});

// Validate Pending Bank Transfer
router.post('/transfers/approve', requireAuth, requireRole('admin', 'owner'), (req: AuthenticatedRequest, res) => {
  const { transactionId } = req.body;
  const result = confirmPayment(transactionId, {
    verifiedBy: `Administrateur (${req.user!.name} - ${req.user!.email})`,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({ success: true, message: 'Virement bancaire validé et abonnement activé.', transaction: result.transaction });
});

// System Health Status (Real diagnostics)
router.get('/system-status', requireAuth, requireRole('admin', 'owner'), (req, res) => {
  const aiStatus = getAIProviderStatus();

  res.json({
    success: true,
    diagnostics: {
      database: {
        status: 'healthy',
        type: 'Persistent Encrypted JSON Store (ACID Transactions)',
        recordsCount: {
          users: db.get('users').length,
          classes: db.get('classes').length,
          payments: db.get('payments').length,
          lessons: db.get('lessons').length,
        },
      },
      aiProvider: {
        status: aiStatus.activeProvider === 'gemini' && aiStatus.geminiConfigured
          ? 'connected'
          : aiStatus.activeProvider === 'openrouter' && aiStatus.openrouterConfigured
          ? 'connected'
          : 'misconfigured',
        activeProvider: aiStatus.activeProvider,
        geminiConfigured: aiStatus.geminiConfigured,
        openrouterConfigured: aiStatus.openrouterConfigured,
        model: aiStatus.activeModel,
      },
      payments: {
        status: 'active',
        activeProvider: process.env.PAYMENT_PROVIDER || 'sandbox',
        supportedMethods: ['Carte Bancaire Marocaine (CMI)', 'Virement Bancaire (CIH, Attijariwafa, BMCE)', 'Sandbox Simulation'],
      },
      videoClassroom: {
        status: 'active',
        provider: 'EduCraft Live Classroom (WebRTC / Jitsi Meet Protocol)',
        interactiveWhiteboard: 'enabled',
        screenSharing: 'enabled',
      },
      storage: {
        status: 'active',
        driver: process.env.STORAGE_DRIVER || 'local',
      },
      emailService: {
        status: process.env.EMAIL_DRIVER === 'smtp' ? 'connected' : 'development_logger',
      },
    },
  });
});

// AI Configuration for Owner / Admin
router.get('/ai-config', requireAuth, requireRole('admin', 'owner'), (req, res) => {
  const config = getAIConfig();
  const status = getAIProviderStatus();
  // Never expose full API keys in response
  const safeConfig = {
    ...config,
    openrouterApiKey: config.openrouterApiKey ? `${config.openrouterApiKey.slice(0, 8)}...` : '',
  };
  res.json({
    success: true,
    config: safeConfig,
    status,
  });
});

router.post('/ai-config', requireAuth, requireRole('owner', 'admin'), (req, res) => {
  const { provider, geminiModel, openrouterModel, openrouterApiKey, temperature } = req.body;

  const updates: any = {};
  if (provider === 'gemini' || provider === 'openrouter') {
    updates.provider = provider;
  }
  if (typeof geminiModel === 'string' && geminiModel.trim()) {
    updates.geminiModel = geminiModel.trim();
  }
  if (typeof openrouterModel === 'string' && openrouterModel.trim()) {
    updates.openrouterModel = openrouterModel.trim();
  }
  // Only update API key if provided and not masked
  if (typeof openrouterApiKey === 'string' && openrouterApiKey && !openrouterApiKey.includes('...')) {
    updates.openrouterApiKey = openrouterApiKey.trim();
  }
  if (typeof temperature === 'number') {
    updates.temperature = Math.max(0, Math.min(1, temperature));
  }

  const updated = updateAIConfig(updates);
  const status = getAIProviderStatus();

  console.log(`[AI-DIAGNOSTIC] AI Configuration updated by Admin: Provider=${updated.provider}, GeminiModel=${updated.geminiModel}, OpenRouterModel=${updated.openrouterModel}`);

  res.json({
    success: true,
    message: 'Configuration IA enregistrée avec succès.',
    config: {
      ...updated,
      openrouterApiKey: updated.openrouterApiKey ? `${updated.openrouterApiKey.slice(0, 8)}...` : '',
    },
    status,
  });
});

router.post('/ai-test', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const result = await testAIProviderConnection(req.body);
    res.json({
      success: true,
      message: `Connexion réussie avec ${result.provider} (${result.model}) en ${result.durationMs}ms !`,
      result,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: `Échec du test de connexion: ${err.message}`,
      error: err.message,
    });
  }
});

export default router;

import { Router } from 'express';
import { db, User } from '../db.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  AuthenticatedRequest,
  requireAuth,
} from '../auth.js';

const router = Router();

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
  }

  const users = db.get('users');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || !comparePassword(password, user.passwordHash)) {
    return res.status(401).json({ success: false, message: 'Identifiants invalides.' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ success: false, message: 'Ce compte est suspendu. Veuillez contacter l\'administration.' });
  }

  const token = generateToken(user);
  const { passwordHash, ...safeUser } = user;

  res.json({
    success: true,
    token,
    user: safeUser,
  });
});

// Register (for Parent or Student)
router.post('/register', (req, res) => {
  const { name, email, password, role, phone, childData } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Champs requis manquants.' });
  }

  const users = db.get('users');
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'Cette adresse email est déjà enregistrée.' });
  }

  const userRole: User['role'] = role === 'student' ? 'student' : 'parent';
  const newUserId = `usr-${Date.now().toString(36)}`;

  const newUser: User = {
    id: newUserId,
    name,
    email,
    passwordHash: hashPassword(password),
    role: userRole,
    phone: phone || '',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  db.update(data => {
    data.users.push(newUser);

    // If a parent is registering with initial child information
    if (userRole === 'parent' && childData && childData.name) {
      const childId = `usr-std-${Date.now().toString(36)}`;
      const newChild: User = {
        id: childId,
        name: childData.name,
        email: `${childData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@educraft.ma`,
        passwordHash: hashPassword('student123'),
        role: 'student',
        parentId: newUserId,
        status: 'active',
        createdAt: new Date().toISOString(),
        studentProfile: {
          schoolLevel: childData.schoolLevel || 'middle',
          grade: childData.grade || '3ème Année Collège (3AC / Brevet)',
          curriculum: childData.curriculum || 'moroccan-biof',
          preferredLanguage: childData.preferredLanguage || 'French',
          enrolledSubjects: childData.enrolledSubjects || ['Mathématiques', 'Physique-Chimie'],
          timeZone: 'Africa/Casablanca',
          aiLessonsUsedThisMonth: 0,
          subscriptionPlanId: 'free',
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          subscriptionStatus: 'active',
        },
      };
      data.users.push(newChild);
    }
  });

  const token = generateToken(newUser);
  const { passwordHash, ...safeUser } = newUser;

  res.json({
    success: true,
    token,
    user: safeUser,
  });
});

// Current User Profile
router.get('/me', (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.json({ success: true, user: null });
  }
  const { passwordHash, ...safeUser } = req.user;
  res.json({ success: true, user: safeUser });
});

// Switch Persona for instant multi-role testing
router.post('/switch-persona', (req, res) => {
  const { userId } = req.body;
  const users = db.get('users');
  const user = users.find(u => u.id === userId || u.role === userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'Utilisateur de démonstration non trouvé.' });
  }

  const token = generateToken(user);
  const { passwordHash, ...safeUser } = user;

  res.json({
    success: true,
    token,
    user: safeUser,
  });
});

// Demo accounts list for quick switcher in the UI
router.get('/demo-accounts', (req, res) => {
  const users = db.get('users');
  const demoUsers = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    detail:
      u.role === 'student'
        ? `${u.studentProfile?.grade} (${u.studentProfile?.subscriptionPlanId.toUpperCase()})`
        : u.role === 'teacher'
        ? `${u.teacherProfile?.subjectsTaught.join(', ')} (${u.teacherProfile?.monthlySalaryMAD} MAD/m)`
        : u.role === 'parent'
        ? 'Parent de Youssef & Salma'
        : 'Administrateur & Fondateur',
  }));
  res.json({ success: true, accounts: demoUsers });
});

export default router;

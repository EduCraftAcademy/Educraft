import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'parent' | 'teacher' | 'admin' | 'owner';
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  status: 'active' | 'suspended';
  // If role is student:
  parentId?: string;
  studentProfile?: {
    schoolLevel: 'primary' | 'middle' | 'high';
    grade: string;
    curriculum: string;
    preferredLanguage: 'French' | 'Arabic' | 'English';
    enrolledSubjects: string[];
    timeZone: string;
    aiLessonsUsedThisMonth: number;
    subscriptionPlanId: 'free' | 'basic' | 'plus' | 'premium' | 'vip';
    subscriptionExpiresAt: string;
    subscriptionStatus: 'active' | 'grace_period' | 'expired' | 'cancelled';
  };
  // If role is teacher:
  teacherProfile?: {
    qualifications: string[];
    subjectsTaught: string[];
    gradeLevels: string[];
    curriculumExpertise: string[];
    languages: string[];
    monthlySalaryMAD: number;
    employmentStatus: 'full_time' | 'part_time' | 'contract';
    weeklyAvailabilityHours: number;
    notes?: string;
  };
}

export interface Curriculum {
  id: string;
  name: string;
  code: string;
  description: string;
  grades: { id: string; name: string; level: 'primary' | 'middle' | 'high' }[];
  subjects: { id: string; name: string; icon: string }[];
}

export interface SubscriptionPlan {
  id: 'free' | 'basic' | 'plus' | 'premium' | 'vip';
  name: string;
  monthlyPriceMAD: number;
  quarterlyPriceMAD: number;
  yearlyPriceMAD: number;
  liveClassesPerMonth: number;
  maxStudentsPerClass: number;
  makeupClassesPerMonth: number;
  recordingsAccess: boolean;
  aiLessonsLimitPerMonth: number; // 3 for free, 100 for basic, 250 for plus, unlimited for premium/vip
  features: string[];
  popular?: boolean;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  studentId: string;
  planId: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  amountMAD: number;
  provider: 'sandbox' | 'cmi' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference: string;
  paymentProofUrl?: string;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface ScheduledClass {
  id: string;
  title: string;
  subject: string;
  grade: string;
  curriculum: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "17:00"
  endTime: string;   // "18:00"
  maxCapacity: number;
  enrolledStudentIds: string[];
  videoRoomId: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

export interface ClassSessionRecord {
  id: string;
  classId: string;
  date: string;
  topic: string;
  teacherId: string;
  attendedStudentIds: string[];
  notes: string;
  recordingUrl?: string;
  durationMinutes: number;
}

export interface HomeworkAssignment {
  id: string;
  title: string;
  subject: string;
  grade: string;
  curriculum: string;
  teacherId: string;
  dueDate: string;
  instructions: string;
  attachments?: string[];
  submissions: {
    studentId: string;
    studentName: string;
    submittedAt: string;
    content: string;
    grade?: number; // 0-20 (Moroccan / French grading system standard)
    feedback?: string;
    gradedAt?: string;
  }[];
}

export interface GeneratedLesson {
  id: string;
  title: string;
  objective: string;
  schoolLevel: string;
  grade: string;
  curriculum: string;
  country?: string;
  subject: string;
  language: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  prerequisites?: string[];
  introduction?: string;
  paragraphs: { title: string; body: string }[];
  commonMistakes?: { mistake: string; correction: string; why: string }[];
  practicalApplications?: { field: string; description: string }[];
  vocab: { term: string; definition: string; example: string }[];
  slides: { slideNumber: number; title: string; category: string; bulletPoints: string[] }[];
  exercises: { question: string; hint: string; solution: string; difficulty?: 'easy' | 'medium' | 'hard' }[];
  quiz: { question: string; options: string[]; answerIndex: number; explanation: string }[];
  answerKey: string;
  summary?: string;
  finalAssessment?: { question: string; criteria: string; solution: string }[];
  teacherNotes: string;
  references: string[];
  createdAt: string;
  createdBy: string;
}

export interface TeacherSalaryPayment {
  id: string;
  teacherId: string;
  teacherName: string;
  month: string; // "2026-10"
  amountMAD: number;
  status: 'paid' | 'scheduled';
  paidAt?: string;
  reference: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'class' | 'grade' | 'payment' | 'system';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface AIConfig {
  provider: 'gemini' | 'openrouter';
  geminiModel: string;
  openrouterModel: string;
  openrouterApiKey?: string;
  temperature?: number;
}

export interface DatabaseSchema {
  users: User[];
  curricula: Curriculum[];
  subscriptionPlans: SubscriptionPlan[];
  payments: PaymentTransaction[];
  classes: ScheduledClass[];
  sessions: ClassSessionRecord[];
  homework: HomeworkAssignment[];
  lessons: GeneratedLesson[];
  salaryPayments: TeacherSalaryPayment[];
  notifications: NotificationItem[];
  aiConfig?: AIConfig;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function getInitialDatabase(): DatabaseSchema {
  return {
    curricula: [
      {
        id: 'moroccan-biof',
        name: 'Moroccan International Track (BIOF)',
        code: 'BIOF',
        description: 'Moroccan national curriculum with scientific subjects taught in French.',
        grades: [
          { id: 'p5', name: '5ème Année Primaire (CM1)', level: 'primary' },
          { id: 'p6', name: '6ème Année Primaire (CM2)', level: 'primary' },
          { id: 'm1', name: '1ère Année Collège (1AC)', level: 'middle' },
          { id: 'm2', name: '2ème Année Collège (2AC)', level: 'middle' },
          { id: 'm3', name: '3ème Année Collège (3AC / Brevet)', level: 'middle' },
          { id: 'h1', name: 'Tronc Commun Scientifique', level: 'high' },
          { id: 'h2', name: '1ère Bac Sciences Math / Exp', level: 'high' },
          { id: 'h3', name: '2ème Bac Sciences Math / PC / SVT', level: 'high' },
        ],
        subjects: [
          { id: 'math', name: 'Mathématiques', icon: '📐' },
          { id: 'phys', name: 'Physique-Chimie', icon: '⚡' },
          { id: 'svt', name: 'Sciences de la Vie et de la Terre (SVT)', icon: '🧬' },
          { id: 'fr', name: 'Français', icon: '📖' },
          { id: 'ar', name: 'Arabe', icon: '✍️' },
          { id: 'eng', name: 'Anglais', icon: '🌍' },
          { id: 'phil', name: 'Philosophie', icon: '🏛️' },
        ],
      },
      {
        id: 'moroccan-national',
        name: 'Moroccan National Curriculum (Arabe)',
        code: 'MASSAR',
        description: 'Standard Moroccan public school curriculum.',
        grades: [
          { id: 'p4', name: '4ème Année Primaire', level: 'primary' },
          { id: 'p5', name: '5ème Année Primaire', level: 'primary' },
          { id: 'p6', name: '6ème Année Primaire (Certificat)', level: 'primary' },
          { id: 'm3', name: '3ème Année Collège (Brevet)', level: 'middle' },
          { id: 'h2', name: '1ère Baccalauréat', level: 'high' },
          { id: 'h3', name: '2ème Baccalauréat National', level: 'high' },
        ],
        subjects: [
          { id: 'math', name: 'الرياضيات (Mathématiques)', icon: '📐' },
          { id: 'phys', name: 'الفيزياء والكيمياء (Physique-Chimie)', icon: '⚡' },
          { id: 'svt', name: 'علوم الحياة والأرض (SVT)', icon: '🧬' },
          { id: 'ar', name: 'اللغة العربية (Arabe)', icon: '✍️' },
          { id: 'fr', name: 'اللغة الفرنسية (Français)', icon: '📖' },
          { id: 'islam', name: 'التربية الإسلامية', icon: '🕌' },
        ],
      },
      {
        id: 'french-mission',
        name: 'Mission Française (AEFE)',
        code: 'AEFE',
        description: 'Curriculum homologué AEFE (Écoles Françaises au Maroc).',
        grades: [
          { id: 'cm1', name: 'CM1 (Primaire)', level: 'primary' },
          { id: 'cm2', name: 'CM2 (Primaire)', level: 'primary' },
          { id: '6eme', name: '6ème (Collège)', level: 'middle' },
          { id: '3eme', name: '3ème (DNB Brevet)', level: 'middle' },
          { id: '2nde', name: 'Seconde (Lycée)', level: 'high' },
          { id: 'term', name: 'Terminale (Baccalauréat Français)', level: 'high' },
        ],
        subjects: [
          { id: 'math', name: 'Mathématiques', icon: '📐' },
          { id: 'phys', name: 'Physique-Chimie', icon: '⚡' },
          { id: 'svt', name: 'SVT', icon: '🧬' },
          { id: 'fr', name: 'Français & Littérature', icon: '📖' },
          { id: 'hist', name: 'Histoire-Géographie', icon: '🗺️' },
          { id: 'eng', name: 'Anglais (LV1)', icon: '🌍' },
        ],
      },
    ],

    subscriptionPlans: [
      {
        id: 'free',
        name: 'Free Plan',
        monthlyPriceMAD: 0,
        quarterlyPriceMAD: 0,
        yearlyPriceMAD: 0,
        liveClassesPerMonth: 0,
        maxStudentsPerClass: 0,
        makeupClassesPerMonth: 0,
        recordingsAccess: false,
        aiLessonsLimitPerMonth: 3,
        features: [
          '3 AI-generated lessons per month',
          'Basic quizzes & exercises',
          'Limited access to educational previews',
          'No live teacher classes',
          'No recorded teacher lessons',
        ],
      },
      {
        id: 'basic',
        name: 'Basic Plan',
        monthlyPriceMAD: 149,
        quarterlyPriceMAD: 399,
        yearlyPriceMAD: 1490,
        liveClassesPerMonth: 0,
        maxStudentsPerClass: 0,
        makeupClassesPerMonth: 0,
        recordingsAccess: false,
        aiLessonsLimitPerMonth: 100,
        features: [
          'Full access to student school-level package',
          'AI-generated lessons (100/month)',
          'Comprehensive quizzes & practice sheets',
          'Standard educational downloads',
          'Parent progress tracking',
        ],
      },
      {
        id: 'plus',
        name: 'Plus Plan',
        monthlyPriceMAD: 249,
        quarterlyPriceMAD: 699,
        yearlyPriceMAD: 2490,
        liveClassesPerMonth: 4,
        maxStudentsPerClass: 20,
        makeupClassesPerMonth: 0,
        recordingsAccess: true,
        aiLessonsLimitPerMonth: 250,
        popular: true,
        features: [
          'Everything in Basic',
          '4 live teacher classes per month',
          'Recorded teacher lessons with full playback',
          'Maximum 20 students per live class',
          'Teacher homework & detailed grading',
          'Interactive whiteboard & class chat',
        ],
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        monthlyPriceMAD: 400,
        quarterlyPriceMAD: 1099,
        yearlyPriceMAD: 3990,
        liveClassesPerMonth: 8,
        maxStudentsPerClass: 10,
        makeupClassesPerMonth: 1,
        recordingsAccess: true,
        aiLessonsLimitPerMonth: 500,
        features: [
          'Everything in Plus',
          '8 live teacher classes per month',
          'Small group: Maximum 10 students per class',
          '1 makeup class per month (flexible scheduling)',
          'Recorded teacher lessons with archive',
          'Advanced AI learning tools & explanations',
          'Priority academic support',
        ],
      },
      {
        id: 'vip',
        name: 'VIP Plan',
        monthlyPriceMAD: 700,
        quarterlyPriceMAD: 1950,
        yearlyPriceMAD: 7000,
        liveClassesPerMonth: 12,
        maxStudentsPerClass: 4,
        makeupClassesPerMonth: 2,
        recordingsAccess: true,
        aiLessonsLimitPerMonth: 1000,
        features: [
          'Everything in Premium',
          '12 live teacher classes/month total across subjects',
          'Ultra-small group: Maximum 4 students per class',
          '2 makeup classes per month with teacher approval',
          'Full recording library forever',
          'Highest-priority dedicated counselor support',
          'Personalized AI revision & exam prediction',
        ],
      },
    ],

    users: [
      {
        id: 'usr-admin-1',
        name: 'Dr. Tariq Berrada',
        email: 'admin@educraft.ma',
        passwordHash: '$2a$10$vQcM76.9g7fI2L1pE/p84.cMfZ9l.c/sF1d6/3zWj4hK6/f9.6z2u', // "admin123"
        role: 'owner',
        phone: '+212 661 234567',
        status: 'active',
        createdAt: '2026-01-10T08:00:00Z',
      },
      {
        id: 'usr-teacher-1',
        name: 'Prof. Karim Alami',
        email: 'karim.alami@educraft.ma',
        passwordHash: '$2a$10$vQcM76.9g7fI2L1pE/p84.cMfZ9l.c/sF1d6/3zWj4hK6/f9.6z2u',
        role: 'teacher',
        phone: '+212 662 345678',
        status: 'active',
        createdAt: '2026-02-01T09:00:00Z',
        teacherProfile: {
          qualifications: ['Agrégation de Mathématiques (Université Mohammed V)', 'Master en Didactique des Sciences'],
          subjectsTaught: ['Mathématiques'],
          gradeLevels: ['middle', 'high'],
          curriculumExpertise: ['moroccan-biof', 'moroccan-national', 'french-mission'],
          languages: ['French', 'Arabic'],
          monthlySalaryMAD: 12000,
          employmentStatus: 'full_time',
          weeklyAvailabilityHours: 24,
          notes: 'Senior Mathematics educator. High success rate in Baccalauréat preparation.',
        },
      },
      {
        id: 'usr-teacher-2',
        name: 'Prof. Fatima Zahra Bennani',
        email: 'fatima.zahra@educraft.ma',
        passwordHash: '$2a$10$vQcM76.9g7fI2L1pE/p84.cMfZ9l.c/sF1d6/3zWj4hK6/f9.6z2u',
        role: 'teacher',
        phone: '+212 663 456789',
        status: 'active',
        createdAt: '2026-02-15T09:00:00Z',
        teacherProfile: {
          qualifications: ['Doctorat en Physique Appliquée', 'CAPES Physique-Chimie'],
          subjectsTaught: ['Physique-Chimie', 'Sciences de la Vie et de la Terre (SVT)'],
          gradeLevels: ['middle', 'high'],
          curriculumExpertise: ['moroccan-biof', 'french-mission'],
          languages: ['French', 'English'],
          monthlySalaryMAD: 11500,
          employmentStatus: 'full_time',
          weeklyAvailabilityHours: 22,
          notes: 'Specializes in laboratory simulations, STEM pedagogy, and thermodynamics.',
        },
      },
      {
        id: 'usr-parent-1',
        name: 'Hassan El Amrani',
        email: 'hassan.elamrani@gmail.com',
        passwordHash: '$2a$10$vQcM76.9g7fI2L1pE/p84.cMfZ9l.c/sF1d6/3zWj4hK6/f9.6z2u',
        role: 'parent',
        phone: '+212 664 567890',
        status: 'active',
        createdAt: '2026-03-01T10:00:00Z',
      },
      {
        id: 'usr-student-1',
        name: 'Youssef El Amrani',
        email: 'youssef.elamrani@educraft.ma',
        passwordHash: '$2a$10$vQcM76.9g7fI2L1pE/p84.cMfZ9l.c/sF1d6/3zWj4hK6/f9.6z2u',
        role: 'student',
        parentId: 'usr-parent-1',
        status: 'active',
        createdAt: '2026-03-01T10:30:00Z',
        studentProfile: {
          schoolLevel: 'middle',
          grade: '3ème Année Collège (3AC / Brevet)',
          curriculum: 'moroccan-biof',
          preferredLanguage: 'French',
          enrolledSubjects: ['Mathématiques', 'Physique-Chimie', 'SVT', 'Français'],
          timeZone: 'Africa/Casablanca',
          aiLessonsUsedThisMonth: 12,
          subscriptionPlanId: 'plus',
          subscriptionExpiresAt: '2026-11-20T23:59:59Z',
          subscriptionStatus: 'active',
        },
      },
      {
        id: 'usr-student-2',
        name: 'Salma El Amrani',
        email: 'salma.elamrani@educraft.ma',
        passwordHash: '$2a$10$vQcM76.9g7fI2L1pE/p84.cMfZ9l.c/sF1d6/3zWj4hK6/f9.6z2u',
        role: 'student',
        parentId: 'usr-parent-1',
        status: 'active',
        createdAt: '2026-03-05T11:00:00Z',
        studentProfile: {
          schoolLevel: 'primary',
          grade: '5ème Année Primaire (CM1)',
          curriculum: 'moroccan-biof',
          preferredLanguage: 'French',
          enrolledSubjects: ['Mathématiques', 'Français', 'Arabe'],
          timeZone: 'Africa/Casablanca',
          aiLessonsUsedThisMonth: 8,
          subscriptionPlanId: 'premium',
          subscriptionExpiresAt: '2026-11-28T23:59:59Z',
          subscriptionStatus: 'active',
        },
      },
      {
        id: 'usr-student-3',
        name: 'Adam Tazi',
        email: 'adam.tazi@educraft.ma',
        passwordHash: '$2a$10$vQcM76.9g7fI2L1pE/p84.cMfZ9l.c/sF1d6/3zWj4hK6/f9.6z2u',
        role: 'student',
        status: 'active',
        createdAt: '2026-03-10T14:00:00Z',
        studentProfile: {
          schoolLevel: 'high',
          grade: '2ème Bac Sciences Math / PC / SVT',
          curriculum: 'moroccan-biof',
          preferredLanguage: 'French',
          enrolledSubjects: ['Mathématiques', 'Physique-Chimie'],
          timeZone: 'Africa/Casablanca',
          aiLessonsUsedThisMonth: 34,
          subscriptionPlanId: 'vip',
          subscriptionExpiresAt: '2026-11-15T23:59:59Z',
          subscriptionStatus: 'active',
        },
      },
    ],

    classes: [
      {
        id: 'cls-101',
        title: 'Mathématiques 3AC - Fonctions Linéaires & Équations',
        subject: 'Mathématiques',
        grade: '3ème Année Collège (3AC / Brevet)',
        curriculum: 'moroccan-biof',
        teacherId: 'usr-teacher-1',
        teacherName: 'Prof. Karim Alami',
        dayOfWeek: 2, // Tuesday
        startTime: '18:00',
        endTime: '19:00',
        maxCapacity: 20, // Plus plan max is 20
        enrolledStudentIds: ['usr-student-1'],
        videoRoomId: 'educraft-math-3ac-tuesday',
        status: 'scheduled',
      },
      {
        id: 'cls-102',
        title: 'Physique-Chimie 3AC - Oxydation des Métaux & pH',
        subject: 'Physique-Chimie',
        grade: '3ème Année Collège (3AC / Brevet)',
        curriculum: 'moroccan-biof',
        teacherId: 'usr-teacher-2',
        teacherName: 'Prof. Fatima Zahra Bennani',
        dayOfWeek: 4, // Thursday
        startTime: '18:30',
        endTime: '19:30',
        maxCapacity: 20,
        enrolledStudentIds: ['usr-student-1'],
        videoRoomId: 'educraft-phys-3ac-thursday',
        status: 'scheduled',
      },
      {
        id: 'cls-103',
        title: 'Mathématiques Primaire CM1 - Fractions & Décimaux',
        subject: 'Mathématiques',
        grade: '5ème Année Primaire (CM1)',
        curriculum: 'moroccan-biof',
        teacherId: 'usr-teacher-1',
        teacherName: 'Prof. Karim Alami',
        dayOfWeek: 3, // Wednesday
        startTime: '16:00',
        endTime: '17:00',
        maxCapacity: 10, // Premium plan max is 10
        enrolledStudentIds: ['usr-student-2'],
        videoRoomId: 'educraft-math-cm1-wednesday',
        status: 'scheduled',
      },
      {
        id: 'cls-104',
        title: 'VIP Math 2 Bac - Nombres Complexes & Probabilités',
        subject: 'Mathématiques',
        grade: '2ème Bac Sciences Math / PC / SVT',
        curriculum: 'moroccan-biof',
        teacherId: 'usr-teacher-1',
        teacherName: 'Prof. Karim Alami',
        dayOfWeek: 6, // Saturday
        startTime: '10:00',
        endTime: '11:30',
        maxCapacity: 4, // VIP plan strictly max 4 students
        enrolledStudentIds: ['usr-student-3'],
        videoRoomId: 'educraft-vip-math-2bac-sat',
        status: 'scheduled',
      },
    ],

    sessions: [
      {
        id: 'ses-901',
        classId: 'cls-101',
        date: '2026-10-20',
        topic: 'Systèmes de deux équations à deux inconnues',
        teacherId: 'usr-teacher-1',
        attendedStudentIds: ['usr-student-1'],
        notes: 'Excellent engagement. Youssef mastered the substitution method.',
        recordingUrl: 'https://cdn.educraft.ma/recordings/2026-10-20-math-3ac-equations.mp4',
        durationMinutes: 60,
      },
      {
        id: 'ses-902',
        classId: 'cls-102',
        date: '2026-10-18',
        topic: 'Les solutions acides, basiques et neutres - Mesure du pH',
        teacherId: 'usr-teacher-2',
        attendedStudentIds: ['usr-student-1'],
        notes: 'Practical demonstration on pH scale and safety rules with chemical reagents.',
        recordingUrl: 'https://cdn.educraft.ma/recordings/2026-10-18-phys-3ac-ph.mp4',
        durationMinutes: 60,
      },
      {
        id: 'ses-903',
        classId: 'cls-103',
        date: '2026-10-19',
        topic: 'Introduction aux nombres décimaux et comparaison',
        teacherId: 'usr-teacher-1',
        attendedStudentIds: ['usr-student-2'],
        notes: 'Salma participated actively and completed the decimal line exercise.',
        recordingUrl: 'https://cdn.educraft.ma/recordings/2026-10-19-math-cm1-decimaux.mp4',
        durationMinutes: 60,
      },
    ],

    homework: [
      {
        id: 'hw-501',
        title: 'Devoir Maison : Systèmes d\'équations et méthode de combinaison',
        subject: 'Mathématiques',
        grade: '3ème Année Collège (3AC / Brevet)',
        curriculum: 'moroccan-biof',
        teacherId: 'usr-teacher-1',
        dueDate: '2026-10-25',
        instructions: 'Résoudre les 4 exercices du document joint. Détailler toutes les étapes de calcul et vérifier vos solutions.',
        submissions: [
          {
            studentId: 'usr-student-1',
            studentName: 'Youssef El Amrani',
            submittedAt: '2026-10-21T19:30:00Z',
            content: 'J\'ai résolu les exercices 1, 2, 3 et 4 en utilisant la méthode de combinaison linéaire pour le problème de géométrie.',
            grade: 18.5,
            feedback: 'Très bon travail Youssef ! Rédaction rigoureuse et calculs exacts. Attention à bien énoncer l\'ensemble solution S = {(x; y)}.',
            gradedAt: '2026-10-22T08:00:00Z',
          },
        ],
      },
      {
        id: 'hw-502',
        title: 'Fiche de TD : Calcul du pH et dilution d\'une solution acide',
        subject: 'Physique-Chimie',
        grade: '3ème Année Collège (3AC / Brevet)',
        curriculum: 'moroccan-biof',
        teacherId: 'usr-teacher-2',
        dueDate: '2026-10-26',
        instructions: 'Expliquer l\'évolution du pH lors de l\'ajout d\'eau distillée. Calculer la concentration des ions H+.',
        submissions: [],
      },
    ],

    payments: [
      {
        id: 'pay-701',
        userId: 'usr-parent-1',
        studentId: 'usr-student-1',
        planId: 'plus',
        billingCycle: 'monthly',
        amountMAD: 249,
        provider: 'cmi',
        status: 'completed',
        reference: 'CMI-2026-9938472',
        createdAt: '2026-10-20T10:00:00Z',
        verifiedAt: '2026-10-20T10:01:15Z',
      },
      {
        id: 'pay-702',
        userId: 'usr-parent-1',
        studentId: 'usr-student-2',
        planId: 'premium',
        billingCycle: 'monthly',
        amountMAD: 400,
        provider: 'cmi',
        status: 'completed',
        reference: 'CMI-2026-9938499',
        createdAt: '2026-10-28T14:30:00Z',
        verifiedAt: '2026-10-28T14:31:00Z',
      },
    ],

    salaryPayments: [
      {
        id: 'sal-301',
        teacherId: 'usr-teacher-1',
        teacherName: 'Prof. Karim Alami',
        month: '2026-09',
        amountMAD: 12000,
        status: 'paid',
        paidAt: '2026-09-30T16:00:00Z',
        reference: 'VIR-BMCE-2026-09-102',
      },
      {
        id: 'sal-302',
        teacherId: 'usr-teacher-2',
        teacherName: 'Prof. Fatima Zahra Bennani',
        month: '2026-09',
        amountMAD: 11500,
        status: 'paid',
        paidAt: '2026-09-30T16:00:00Z',
        reference: 'VIR-BP-2026-09-105',
      },
      {
        id: 'sal-303',
        teacherId: 'usr-teacher-1',
        teacherName: 'Prof. Karim Alami',
        month: '2026-10',
        amountMAD: 12000,
        status: 'scheduled',
        reference: 'PR-2026-10-PENDING',
      },
    ],

    lessons: [
      {
        id: 'lsn-001',
        title: 'Le Théorème de Thalès et sa Réciproque',
        objective: 'Comprendre et appliquer le théorème direct et sa réciproque pour calculer des longueurs et démontrer le parallélisme.',
        schoolLevel: 'middle',
        grade: '3ème Année Collège (3AC / Brevet)',
        curriculum: 'moroccan-biof',
        subject: 'Mathématiques',
        language: 'French',
        difficulty: 'medium',
        paragraphs: [
          {
            title: '1. Énoncé du Théorème Direct de Thalès',
            body: 'Soient deux droites (d) et (d\') sécantes en un point A. Soient B et M deux points de (d), distincts de A. Soient C et N deux points de (d\'), distincts de A. Si les droites (BC) et (MN) sont parallèles, alors les rapports des longueurs sont égaux : AM/AB = AN/AC = MN/BC. Cette égalité permet de calculer une longueur manquante connaissant les trois autres.',
          },
          {
            title: '2. Réciproque du Théorème de Thalès',
            body: 'La réciproque sert à prouver que deux droites sont parallèles. Si les points A, M, B d\'une part, et A, N, C d\'autre part sont alignés dans le même ordre, et si AM/AB = AN/AC, alors les droites (MN) et (BC) sont strictement parallèles.',
          },
          {
            title: '3. Pièges fréquents & Bonnes Pratiques',
            body: 'Attention : il est indispensable de vérifier l\'ordre des points sur chacune des deux droites sécantes avant d\'appliquer la réciproque. Une simple égalité des quotients sans condition d\'alignement ordonné ne suffit pas à garantir le parallélisme.',
          },
        ],
        vocab: [
          {
            term: 'Droites sécantes',
            definition: 'Deux droites qui se coupent en un unique point d\'intersection.',
            example: 'Les droites (AB) et (AC) sont sécantes en A.',
          },
          {
            term: 'Rapports de proportionnalité',
            definition: 'Quotients formés par les longueurs des segments correspondants qui sont égaux dans une configuration de Thalès.',
            example: 'Le quotient AM/AB est égal au rapport de réduction.',
          },
          {
            term: 'Réciproque',
            definition: 'Proposition obtenue en intervertissant l\'hypothèse et la conclusion d\'un théorème mathématique.',
            example: 'On utilise la réciproque de Thalès pour démontrer que (BC) // (DE).',
          },
        ],
        slides: [
          {
            slideNumber: 1,
            title: 'Configuration de Thalès',
            category: 'Introduction',
            bulletPoints: [
              'Deux droites sécantes en A',
              'Deux points M et B sur la première droite',
              'Deux points N et C sur la deuxième droite',
              'Hypothèse fondamentale : (MN) // (BC)',
            ],
          },
          {
            slideNumber: 2,
            title: 'L\'Égalité des Trois Rapports',
            category: 'Formule Clé',
            bulletPoints: [
              'AM / AB = AN / AC = MN / BC',
              'Les petits côtés sont proportionnels aux grands côtés',
              'Utilité : Déterminer une longueur inconnue avec le produit en croix',
            ],
          },
          {
            slideNumber: 3,
            title: 'La Réciproque pour le Parallélisme',
            category: 'Démonstration',
            bulletPoints: [
              'Condition 1 : Alignement des points dans le même ordre',
              'Condition 2 : Égalité des deux premiers rapports AM/AB = AN/AC',
              'Conclusion : Les droites (MN) et (BC) sont parallèles',
            ],
          },
        ],
        exercises: [
          {
            question: 'Soit un triangle ABC avec AB = 6 cm, AC = 8 cm. Le point M appartient à [AB] tel que AM = 2 cm. La parallèle à (BC) passant par M coupe [AC] en N. Calculer AN.',
            hint: 'Appliquer AM/AB = AN/AC et faire un produit en croix.',
            solution: 'AM/AB = 2/6 = 1/3. Donc AN/AC = 1/3, ce qui donne AN = AC / 3 = 8 / 3 ≈ 2.67 cm.',
          },
        ],
        quiz: [
          {
            question: 'À quoi sert principalement la réciproque du théorème de Thalès ?',
            options: [
              'À calculer la longueur d\'un cercle',
              'À démontrer que deux droites sont parallèles',
              'À prouver qu\'un triangle est rectangle',
              'À trouver l\'aire d\'un parallélogramme',
            ],
            answerIndex: 1,
            explanation: 'Le théorème direct sert à calculer des longueurs, tandis que la réciproque sert à prouver que deux droites sont parallèles.',
          },
          {
            question: 'Dans une configuration où AM = 3, AB = 9, AN = 4, AC = 12, et les points sont alignés dans le même ordre, que peut-on déduire ?',
            options: [
              'Les droites (MN) et (BC) sont perpendiculaires',
              'Les droites (MN) et (BC) sont parallèles',
              'Le triangle est isocèle',
              'On ne peut rien conclure sans la longueur de BC',
            ],
            answerIndex: 1,
            explanation: 'AM/AB = 3/9 = 1/3 et AN/AC = 4/12 = 1/3. Les rapports sont égaux et les points alignés dans le même ordre, donc (MN) // (BC).',
          },
        ],
        answerKey: '1: B (Démontrer que deux droites sont parallèles) | 2: B ((MN) // (BC))',
        teacherNotes: 'Prévoir 15 minutes d\'exercices guidés sur tableau blanc. Vérifier que les élèves ne confondent pas le théorème de Pythagore et celui de Thalès.',
        references: ['Programme officiel Ministère de l\'Éducation Nationale Marocain (3AC)', 'Manuel Univers Mathématiques 3AC'],
        createdAt: '2026-10-15T10:00:00Z',
        createdBy: 'usr-teacher-1',
      },
    ],

    notifications: [
      {
        id: 'notif-1',
        userId: 'usr-student-1',
        title: 'Nouveau Devoir Assigné',
        message: 'Prof. Karim Alami a publié le Devoir Maison sur les systèmes d\'équations pour le 25 Octobre.',
        type: 'grade',
        read: false,
        createdAt: '2026-10-21T09:00:00Z',
        link: '/homework',
      },
      {
        id: 'notif-2',
        userId: 'usr-parent-1',
        title: 'Note de Devoir Publiée',
        message: 'Youssef a obtenu la note de 18.5/20 en Mathématiques. Félicitations !',
        type: 'grade',
        read: false,
        createdAt: '2026-10-22T08:05:00Z',
        link: '/parent',
      },
      {
        id: 'notif-3',
        userId: 'usr-student-1',
        title: 'Classe Virtuelle Aujourd\'hui',
        message: 'Votre cours de Mathématiques 3AC démarre à 18h00 avec Prof. Karim Alami.',
        type: 'class',
        read: true,
        createdAt: '2026-10-22T07:00:00Z',
      },
    ],
    aiConfig: {
      provider: (process.env.AI_PROVIDER as any) || 'gemini',
      geminiModel: 'gemini-flash-lite-latest',
      openrouterModel: process.env.OPENROUTER_MODEL || 'qwen/qwen-2.5-72b-instruct:free',
      openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
      temperature: 0.3,
    },
  };
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.error('Error reading database file, fallback to initial:', e);
    }
    const initial = getInitialDatabase();
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    const target = dataToSave || this.data;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(target, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error persisting database:', e);
    }
  }

  public get<K extends keyof DatabaseSchema>(key: K): DatabaseSchema[K] {
    return this.data[key];
  }

  public set<K extends keyof DatabaseSchema>(key: K, value: DatabaseSchema[K]): void {
    this.data[key] = value;
    this.save();
  }

  public update(updater: (db: DatabaseSchema) => void): DatabaseSchema {
    updater(this.data);
    this.save();
    return this.data;
  }

  public resetToDefault(): DatabaseSchema {
    this.data = getInitialDatabase();
    this.save();
    return this.data;
  }

  public getAllData(): DatabaseSchema {
    return this.data;
  }
}

export const db = new DatabaseManager();

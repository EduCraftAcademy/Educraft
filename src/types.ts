export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'parent' | 'teacher' | 'admin' | 'owner';
  phone?: string;
  avatarUrl?: string;
  status: 'active' | 'suspended';
  createdAt: string;
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
  aiLessonsLimitPerMonth: number;
  features: string[];
  popular?: boolean;
}

export interface ScheduledClass {
  id: string;
  title: string;
  subject: string;
  grade: string;
  curriculum: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
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
  recordingLocked?: boolean;
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
  submissions: {
    studentId: string;
    studentName: string;
    submittedAt: string;
    content: string;
    grade?: number;
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
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface TeacherSalaryPayment {
  id: string;
  teacherId: string;
  teacherName: string;
  month: string;
  amountMAD: number;
  status: 'paid' | 'scheduled';
  paidAt?: string;
  reference: string;
}

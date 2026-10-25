import {
  User,
  Curriculum,
  SubscriptionPlan,
  ScheduledClass,
  ClassSessionRecord,
  HomeworkAssignment,
  GeneratedLesson,
  PaymentTransaction,
  TeacherSalaryPayment,
} from '../types';

function getToken(): string | null {
  return localStorage.getItem('educraft_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

// Auth API
export const authApi = {
  getMe: () => apiRequest<{ success: boolean; user: User | null }>('/api/auth/me'),
  login: (email: string, password: string) =>
    apiRequest<{ success: boolean; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (payload: any) =>
    apiRequest<{ success: boolean; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  switchPersona: (userId: string) =>
    apiRequest<{ success: boolean; token: string; user: User }>('/api/auth/switch-persona', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  getDemoAccounts: () =>
    apiRequest<{ success: boolean; accounts: Array<{ id: string; name: string; email: string; role: string; detail: string }> }>(
      '/api/auth/demo-accounts'
    ),
};

// AI Learning API
export const aiApi = {
  getStatus: () => apiRequest<{ success: boolean; status: any }>('/api/ai/status'),
  generateLesson: (params: any) =>
    apiRequest<{ success: boolean; lesson: GeneratedLesson; providerUsed: string; modelUsed: string; quotaExceeded?: boolean }>(
      '/api/ai/generate',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    ),
  getLessons: () => apiRequest<{ success: boolean; lessons: GeneratedLesson[] }>('/api/ai/lessons'),
  getLesson: (id: string) => apiRequest<{ success: boolean; lesson: GeneratedLesson }>(`/api/ai/lessons/${id}`),
};

// Subscriptions & Payments API
export const subscriptionApi = {
  getPlans: () => apiRequest<{ success: boolean; plans: SubscriptionPlan[] }>('/api/subscriptions/plans'),
  checkout: (params: { studentId: string; planId: string; billingCycle: string; provider?: string }) =>
    apiRequest<{ success: boolean; order: PaymentTransaction; calculatedAmountMAD: number }>(
      '/api/subscriptions/checkout',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    ),
  confirmPayment: (transactionId: string) =>
    apiRequest<{ success: boolean; message: string; transaction: PaymentTransaction }>(
      '/api/subscriptions/confirm',
      {
        method: 'POST',
        body: JSON.stringify({ transactionId }),
      }
    ),
  submitBankTransfer: (params: { studentId: string; planId: string; billingCycle: string; bankName: string; transferReference: string }) =>
    apiRequest<{ success: boolean; message: string; order: PaymentTransaction }>(
      '/api/subscriptions/bank-transfer',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    ),
  getHistory: () => apiRequest<{ success: boolean; payments: PaymentTransaction[] }>('/api/subscriptions/history'),
};

// Classes & Live Video API
export const classesApi = {
  getTimetable: () => apiRequest<{ success: boolean; classes: ScheduledClass[] }>('/api/classes/timetable'),
  getSessions: () => apiRequest<{ success: boolean; sessions: ClassSessionRecord[]; allowedRecordings: boolean }>('/api/classes/sessions'),
  joinClass: (classId: string) =>
    apiRequest<{
      success: boolean;
      classDetails: ScheduledClass;
      videoRoomId: string;
      roomToken: string;
      isHost: boolean;
      features: any;
    }>(`/api/classes/join/${classId}`),
  autoAssign: (studentId?: string, subject?: string) =>
    apiRequest<{ success: boolean; assignedClass?: ScheduledClass; actionTaken: string; reason: string }>(
      '/api/classes/auto-assign',
      {
        method: 'POST',
        body: JSON.stringify({ studentId, subject }),
      }
    ),
  recordAttendance: (payload: any) =>
    apiRequest<{ success: boolean; session: ClassSessionRecord }>('/api/classes/attendance', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// Student & Parent API
export const studentApi = {
  getChildren: () => apiRequest<{ success: boolean; children: any[] }>('/api/students/children'),
  addChild: (payload: any) => apiRequest<{ success: boolean; child: User }>('/api/students/add-child', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};

// Teacher API
export const teacherApi = {
  getWorkspace: (teacherId?: string) =>
    apiRequest<{
      success: boolean;
      teacher: User;
      classes: ScheduledClass[];
      homework: HomeworkAssignment[];
      enrolledStudents: any[];
      salaryPayments: TeacherSalaryPayment[];
    }>(`/api/teachers/workspace${teacherId ? `?teacherId=${teacherId}` : ''}`),
  createHomework: (payload: any) =>
    apiRequest<{ success: boolean; homework: HomeworkAssignment }>('/api/teachers/homework', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  gradeSubmission: (payload: { homeworkId: string; studentId: string; grade: number; feedback: string }) =>
    apiRequest<{ success: boolean; message: string }>('/api/teachers/grade-submission', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submitHomework: (payload: { homeworkId: string; content: string }) =>
    apiRequest<{ success: boolean; message: string }>('/api/teachers/submit-homework', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// Admin API
export const adminApi = {
  getMetrics: () => apiRequest<{ success: boolean; metrics: any }>('/api/admin/metrics'),
  getUsers: () => apiRequest<{ success: boolean; users: User[] }>('/api/admin/users'),
  setUserStatus: (id: string, status: 'active' | 'suspended') =>
    apiRequest<{ success: boolean; user: User }>(`/api/admin/users/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  getSalaries: () =>
    apiRequest<{ success: boolean; teachers: any[]; history: TeacherSalaryPayment[] }>('/api/admin/salaries'),
  updateSalary: (teacherId: string, monthlySalaryMAD: number, employmentStatus?: string) =>
    apiRequest<{ success: boolean; message: string }>('/api/admin/salaries/update', {
      method: 'POST',
      body: JSON.stringify({ teacherId, monthlySalaryMAD, employmentStatus }),
    }),
  paySalary: (payload: any) =>
    apiRequest<{ success: boolean; payment: TeacherSalaryPayment }>('/api/admin/salaries/pay', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updatePlanPrice: (payload: any) =>
    apiRequest<{ success: boolean; message: string }>('/api/admin/plans/update', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  approveTransfer: (transactionId: string) =>
    apiRequest<{ success: boolean; message: string; transaction: PaymentTransaction }>('/api/admin/transfers/approve', {
      method: 'POST',
      body: JSON.stringify({ transactionId }),
    }),
  getSystemStatus: () => apiRequest<{ success: boolean; diagnostics: any }>('/api/admin/system-status'),
  getAIConfig: () => apiRequest<{ success: boolean; config: any; status: any }>('/api/admin/ai-config'),
  updateAIConfig: (payload: any) =>
    apiRequest<{ success: boolean; message: string; config: any; status: any }>('/api/admin/ai-config', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  testAIConnection: (payload?: any) =>
    apiRequest<{ success: boolean; message: string; result?: any }>('/api/admin/ai-test', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),
};

// Curricula API
export const curriculumApi = {
  getCurricula: () => apiRequest<{ success: boolean; curricula: Curriculum[] }>('/api/curricula'),
};

// Document Exports Trigger
export function downloadLessonFile(lessonId: string, format: 'pdf' | 'docx' | 'pptx') {
  const token = getToken();
  const url = `/api/exports/${format}/${lessonId}`;

  // Fetch with auth and initiate blob download
  fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
    .then(res => {
      if (!res.ok) throw new Error('Échec du téléchargement.');
      return res.blob();
    })
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `EduCraft_Lesson_${lessonId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch(err => {
      console.error('Export download error:', err);
      alert('Erreur lors du téléchargement du fichier.');
    });
}

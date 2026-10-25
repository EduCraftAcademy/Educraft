import { Router } from 'express';
import { db, HomeworkAssignment, TeacherSalaryPayment } from '../db.js';
import { AuthenticatedRequest, requireAuth, requireRole } from '../auth.js';

const router = Router();

// Teacher Workspace Overview
router.get('/workspace', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'teacher' && user.role !== 'admin' && user.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Accès réservé au corps professoral.' });
  }

  const teacherId = user.role === 'teacher' ? user.id : (req.query.teacherId as string) || user.id;

  const classes = db.get('classes').filter(c => c.teacherId === teacherId);
  const homework = db.get('homework').filter(h => h.teacherId === teacherId);
  const salaryPayments = db.get('salaryPayments').filter(s => s.teacherId === teacherId);
  const users = db.get('users');

  // Enrolled student details for this teacher's classes
  const allStudentIds = Array.from(new Set(classes.flatMap(c => c.enrolledStudentIds)));
  const enrolledStudents = users
    .filter(u => allStudentIds.includes(u.id))
    .map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      grade: s.studentProfile?.grade,
      curriculum: s.studentProfile?.curriculum,
      plan: s.studentProfile?.subscriptionPlanId,
    }));

  res.json({
    success: true,
    teacher: user,
    classes,
    homework,
    enrolledStudents,
    salaryPayments,
  });
});

// Create Homework
router.post('/homework', requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.user!.role !== 'teacher' && req.user!.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Seul un enseignant peut assigner des devoirs.' });
  }

  const { title, subject, grade, curriculum, dueDate, instructions } = req.body;
  if (!title || !subject || !instructions) {
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
  }

  const newHw: HomeworkAssignment = {
    id: `hw-${Date.now().toString(36)}`,
    title,
    subject,
    grade: grade || '3ème Année Collège (3AC / Brevet)',
    curriculum: curriculum || 'moroccan-biof',
    teacherId: req.user!.id,
    dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    instructions,
    submissions: [],
  };

  db.update(data => {
    data.homework.unshift(newHw);
  });

  res.json({ success: true, homework: newHw });
});

// Grade a Homework Submission
router.post('/grade-submission', requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.user!.role !== 'teacher' && req.user!.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Seul un enseignant peut corriger et noter.' });
  }

  const { homeworkId, studentId, grade, feedback } = req.body;
  if (!homeworkId || !studentId || typeof grade !== 'number') {
    return res.status(400).json({ success: false, message: 'Paramètres de notation invalides.' });
  }

  let updated = false;
  db.update(data => {
    const hw = data.homework.find(h => h.id === homeworkId);
    if (!hw) return;
    const sub = hw.submissions.find(s => s.studentId === studentId);
    if (sub) {
      sub.grade = grade;
      sub.feedback = feedback;
      sub.gradedAt = new Date().toISOString();
      updated = true;
    } else {
      // Create graded submission entry
      const student = data.users.find(u => u.id === studentId);
      hw.submissions.push({
        studentId,
        studentName: student?.name || 'Élève',
        submittedAt: new Date().toISOString(),
        content: 'Devoir rendu en classe ou téléversé.',
        grade,
        feedback,
        gradedAt: new Date().toISOString(),
      });
      updated = true;
    }

    // Send notification to student and parent
    const student = data.users.find(u => u.id === studentId);
    if (student) {
      data.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: studentId,
        title: `Nouvelle note : ${grade}/20 en ${hw.subject}`,
        message: feedback ? `Remarque du professeur : "${feedback}"` : 'Votre travail a été évalué.',
        type: 'grade',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/homework',
      });
      if (student.parentId) {
        data.notifications.unshift({
          id: `notif-p-${Date.now()}`,
          userId: student.parentId,
          title: `Note de ${student.name} : ${grade}/20`,
          message: `Devoir : ${hw.title} en ${hw.subject}. Appréciation : ${feedback || 'Bien'}`,
          type: 'grade',
          read: false,
          createdAt: new Date().toISOString(),
          link: '/parent',
        });
      }
    }
  });

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Devoir ou soumission introuvable.' });
  }

  res.json({ success: true, message: 'Note et commentaires enregistrés avec succès.' });
});

// Student submit homework
router.post('/submit-homework', requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.user!.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Seul un élève peut soumettre son devoir.' });
  }

  const { homeworkId, content } = req.body;
  if (!homeworkId || !content) {
    return res.status(400).json({ success: false, message: 'Contenu du devoir manquant.' });
  }

  db.update(data => {
    const hw = data.homework.find(h => h.id === homeworkId);
    if (!hw) return;
    const existing = hw.submissions.find(s => s.studentId === req.user!.id);
    if (existing) {
      existing.content = content;
      existing.submittedAt = new Date().toISOString();
    } else {
      hw.submissions.push({
        studentId: req.user!.id,
        studentName: req.user!.name,
        submittedAt: new Date().toISOString(),
        content,
      });
    }
  });

  res.json({ success: true, message: 'Votre travail a été soumis à l\'enseignant.' });
});

export default router;

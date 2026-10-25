import { Router } from 'express';
import { db, User } from '../db.js';
import { AuthenticatedRequest, requireAuth } from '../auth.js';

const router = Router();

// Children list for authenticated parent
router.get('/children', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const users = db.get('users');
  const homework = db.get('homework');
  const sessions = db.get('sessions');
  const classes = db.get('classes');
  const plans = db.get('subscriptionPlans');

  // If parent, filter children linked to this parent. If student, return self.
  const children =
    user.role === 'parent'
      ? users.filter(u => u.parentId === user.id && u.role === 'student')
      : user.role === 'student'
      ? [user]
      : users.filter(u => u.role === 'student');

  const detailedChildren = children.map(child => {
    const profile = child.studentProfile!;
    const plan = plans.find(p => p.id === profile?.subscriptionPlanId) || plans[0];

    // Submissions and grades
    const mySubmissions = homework.flatMap(hw =>
      hw.submissions
        .filter(sub => sub.studentId === child.id)
        .map(sub => ({
          homeworkId: hw.id,
          homeworkTitle: hw.title,
          subject: hw.subject,
          grade: sub.grade,
          feedback: sub.feedback,
          submittedAt: sub.submittedAt,
        }))
    );

    // Calculate average grade (/20)
    const gradedSubmissions = mySubmissions.filter(s => typeof s.grade === 'number');
    const averageGrade =
      gradedSubmissions.length > 0
        ? (gradedSubmissions.reduce((acc, curr) => acc + (curr.grade || 0), 0) / gradedSubmissions.length).toFixed(1)
        : null;

    // Attendance stats
    const totalSessions = sessions.filter(s =>
      classes.find(c => c.id === s.classId)?.enrolledStudentIds.includes(child.id)
    );
    const attendedCount = totalSessions.filter(s => s.attendedStudentIds.includes(child.id)).length;
    const attendanceRate = totalSessions.length > 0 ? Math.round((attendedCount / totalSessions.length) * 100) : 100;

    // Upcoming classes
    const childClasses = classes.filter(c => c.enrolledStudentIds.includes(child.id));

    return {
      id: child.id,
      name: child.name,
      email: child.email,
      studentProfile: profile,
      plan,
      averageGrade,
      mySubmissions,
      attendanceStats: {
        total: totalSessions.length,
        attended: attendedCount,
        ratePercentage: attendanceRate,
      },
      enrolledClassesCount: childClasses.length,
    };
  });

  res.json({ success: true, children: detailedChildren });
});

// Add a child to parent account
router.post('/add-child', requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.user!.role !== 'parent') {
    return res.status(403).json({ success: false, message: 'Seul un parent peut ajouter un élève.' });
  }

  const { name, schoolLevel, grade, curriculum, preferredLanguage, enrolledSubjects } = req.body;

  if (!name || !grade) {
    return res.status(400).json({ success: false, message: 'Le nom et la classe sont obligatoires.' });
  }

  const childId = `usr-std-${Date.now().toString(36)}`;
  const cleanEmail = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.${Date.now().toString().slice(-4)}@educraft.ma`;

  const newChild: User = {
    id: childId,
    name,
    email: cleanEmail,
    passwordHash: '$2a$10$vQcM76.9g7fI2L1pE/p84.cMfZ9l.c/sF1d6/3zWj4hK6/f9.6z2u', // student123
    role: 'student',
    parentId: req.user!.id,
    status: 'active',
    createdAt: new Date().toISOString(),
    studentProfile: {
      schoolLevel: schoolLevel || 'middle',
      grade,
      curriculum: curriculum || 'moroccan-biof',
      preferredLanguage: preferredLanguage || 'French',
      enrolledSubjects: enrolledSubjects || ['Mathématiques', 'Physique-Chimie'],
      timeZone: 'Africa/Casablanca',
      aiLessonsUsedThisMonth: 0,
      subscriptionPlanId: 'free',
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      subscriptionStatus: 'active',
    },
  };

  db.update(data => {
    data.users.push(newChild);
  });

  res.json({ success: true, child: newChild });
});

export default router;

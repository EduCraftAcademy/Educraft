import { Router } from 'express';
import { db, ClassSessionRecord } from '../db.js';
import { AuthenticatedRequest, requireAuth, checkStudentEntitlement } from '../auth.js';
import { automaticallyAssignStudentToClass } from '../scheduling.js';

const router = Router();

// Timetable / Scheduled Classes
router.get('/timetable', requireAuth, (req: AuthenticatedRequest, res) => {
  const classes = db.get('classes');
  const user = req.user!;

  let userClasses = classes;
  if (user.role === 'student') {
    userClasses = classes.filter(c => c.enrolledStudentIds.includes(user.id));
  } else if (user.role === 'teacher') {
    userClasses = classes.filter(c => c.teacherId === user.id);
  } else if (user.role === 'parent') {
    const users = db.get('users');
    const childIds = users.filter(u => u.parentId === user.id).map(u => u.id);
    userClasses = classes.filter(c => c.enrolledStudentIds.some(id => childIds.includes(id)));
  }

  res.json({ success: true, classes: userClasses });
});

// Join Classroom (generates secure token & permissions)
router.get('/join/:classId', requireAuth, (req: AuthenticatedRequest, res) => {
  const { classId } = req.params;
  const classes = db.get('classes');
  const cls = classes.find(c => c.id === classId);

  if (!cls) {
    return res.status(404).json({ success: false, message: 'Classe introuvable.' });
  }

  const user = req.user!;

  // Student authorization & entitlement check
  if (user.role === 'student') {
    const entitlement = checkStudentEntitlement(user, 'live_classes');
    if (!entitlement.allowed) {
      return res.status(403).json({ success: false, message: entitlement.reason });
    }

    if (!cls.enrolledStudentIds.includes(user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas inscrit à ce cours particulier.',
      });
    }
  }

  // Teacher authorization check
  if (user.role === 'teacher' && cls.teacherId !== user.id) {
    return res.status(403).json({
      success: false,
      message: 'Vous n\'êtes pas l\'enseignant désigné pour ce cours.',
    });
  }

  // Generate classroom session metadata
  const isHost = user.role === 'teacher' || user.role === 'admin' || user.role === 'owner';
  const roomToken = `room_jwt_${Buffer.from(
    JSON.stringify({
      userId: user.id,
      userName: user.name,
      classId: cls.id,
      roomId: cls.videoRoomId,
      isHost,
      exp: Date.now() + 3600 * 1000,
    })
  ).toString('base64')}`;

  res.json({
    success: true,
    classDetails: cls,
    videoRoomId: cls.videoRoomId,
    roomToken,
    isHost,
    features: {
      whiteboard: true,
      screenShare: true,
      chat: true,
      handRaise: true,
      recordingEnabled: isHost,
    },
  });
});

// Past Sessions & Recordings
router.get('/sessions', requireAuth, (req: AuthenticatedRequest, res) => {
  const sessions = db.get('sessions');
  const user = req.user!;

  // If student, check recording entitlement (Plus, Premium, VIP only)
  let allowedRecordings = true;
  if (user.role === 'student') {
    const entitlement = checkStudentEntitlement(user, 'recordings');
    allowedRecordings = entitlement.allowed;
  }

  const sanitizedSessions = sessions.map(s => ({
    ...s,
    recordingUrl: allowedRecordings ? s.recordingUrl : null,
    recordingLocked: !allowedRecordings && Boolean(s.recordingUrl),
  }));

  res.json({ success: true, sessions: sanitizedSessions, allowedRecordings });
});

// Auto-assign student to class
router.post('/auto-assign', requireAuth, (req: AuthenticatedRequest, res) => {
  const { studentId, subject } = req.body;
  const targetStudentId = studentId || req.user!.id;

  const result = automaticallyAssignStudentToClass(targetStudentId, subject);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// Mark Attendance
router.post('/attendance', requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.user!.role !== 'teacher' && req.user!.role !== 'admin' && req.user!.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Seuls les enseignants peuvent noter la présence.' });
  }

  const { classId, date, topic, attendedStudentIds, notes } = req.body;
  if (!classId || !topic) {
    return res.status(400).json({ success: false, message: 'Paramètres manquants.' });
  }

  const newSession: ClassSessionRecord = {
    id: `ses-${Date.now().toString(36)}`,
    classId,
    date: date || new Date().toISOString().split('T')[0],
    topic,
    teacherId: req.user!.id,
    attendedStudentIds: attendedStudentIds || [],
    notes: notes || 'Séance normale complétée.',
    durationMinutes: 60,
  };

  db.update(data => {
    data.sessions.unshift(newSession);
  });

  res.json({ success: true, session: newSession });
});

export default router;

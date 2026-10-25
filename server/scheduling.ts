import { db, ScheduledClass, User } from './db.js';

export interface AllocationResult {
  success: boolean;
  assignedClass?: ScheduledClass;
  actionTaken: 'enrolled_existing' | 'created_new_class' | 'added_to_waitlist';
  reason: string;
}

export function automaticallyAssignStudentToClass(
  studentId: string,
  subject: string
): AllocationResult {
  const users = db.get('users');
  const student = users.find(u => u.id === studentId && u.role === 'student');

  if (!student || !student.studentProfile) {
    return { success: false, actionTaken: 'added_to_waitlist', reason: 'Student profile not found.' };
  }

  const profile = student.studentProfile;
  const planId = profile.subscriptionPlanId;

  if (planId === 'free' || planId === 'basic') {
    return {
      success: false,
      actionTaken: 'added_to_waitlist',
      reason: 'Your current plan does not include live classes. Please upgrade to Plus, Premium, or VIP.',
    };
  }

  // Determine allowed max class size based on plan
  let planCapacityLimit = 20; // Plus default
  if (planId === 'vip') planCapacityLimit = 4;
  else if (planId === 'premium') planCapacityLimit = 10;

  let assignedClass: ScheduledClass | undefined;
  let actionTaken: 'enrolled_existing' | 'created_new_class' | 'added_to_waitlist' = 'added_to_waitlist';
  let reason = '';

  db.update(data => {
    // 1. Look for existing scheduled classes matching curriculum, grade, and subject
    const compatibleClasses = data.classes.filter(c => {
      if (c.subject !== subject) return false;
      if (c.grade !== profile.grade) return false;
      if (c.curriculum !== profile.curriculum) return false;
      if (c.status !== 'scheduled') return false;
      if (c.enrolledStudentIds.includes(studentId)) return false; // already in this class
      // Class capacity check:
      // If student is VIP, class capacity must not exceed 4!
      const effectiveMax = Math.min(c.maxCapacity, planCapacityLimit);
      return c.enrolledStudentIds.length < effectiveMax;
    });

    if (compatibleClasses.length > 0) {
      // Pick first compatible class
      const target = compatibleClasses[0];
      target.enrolledStudentIds.push(studentId);
      // Adjust class capacity ceiling if student has stricter VIP requirement
      if (planCapacityLimit < target.maxCapacity) {
        target.maxCapacity = planCapacityLimit;
      }
      assignedClass = target;
      actionTaken = 'enrolled_existing';
      reason = `Affecté avec succès à la classe ${target.title} avec ${target.teacherName}.`;
      return;
    }

    // 2. No existing class with room: find qualified teacher to open a new group
    const teachers = data.users.filter(u => u.role === 'teacher' && u.teacherProfile);
    const qualifiedTeacher = teachers.find(t => {
      const tp = t.teacherProfile!;
      return (
        tp.subjectsTaught.some(s => s.toLowerCase().includes(subject.toLowerCase())) &&
        tp.curriculumExpertise.includes(profile.curriculum)
      );
    });

    if (qualifiedTeacher) {
      const newClassId = `cls-${Date.now().toString(36)}`;
      const newClass: ScheduledClass = {
        id: newClassId,
        title: `${subject} (${profile.grade}) - Groupe ${data.classes.length + 1}`,
        subject,
        grade: profile.grade,
        curriculum: profile.curriculum,
        teacherId: qualifiedTeacher.id,
        teacherName: qualifiedTeacher.name,
        dayOfWeek: Math.floor(Math.random() * 5) + 1, // Mon-Fri
        startTime: '18:00',
        endTime: '19:00',
        maxCapacity: planCapacityLimit,
        enrolledStudentIds: [studentId],
        videoRoomId: `educraft-room-${newClassId}`,
        status: 'scheduled',
      };
      data.classes.push(newClass);
      assignedClass = newClass;
      actionTaken = 'created_new_class';
      reason = `Nouveau groupe ouvert avec ${qualifiedTeacher.name} (Capacité max : ${planCapacityLimit} élèves).`;
      return;
    }

    // 3. Waiting list fallback
    actionTaken = 'added_to_waitlist';
    reason = `Aucun enseignant disponible immédiatement pour ${subject} au niveau ${profile.grade}. Placé sur liste d'attente prioritaire.`;
  });

  return {
    success: actionTaken !== 'added_to_waitlist',
    assignedClass,
    actionTaken,
    reason,
  };
}

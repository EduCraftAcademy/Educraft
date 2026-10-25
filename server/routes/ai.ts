import { Router } from 'express';
import { db, GeneratedLesson } from '../db.js';
import { AuthenticatedRequest, requireAuth, checkStudentEntitlement } from '../auth.js';
import { generateLessonWithAI, getAIProviderStatus } from '../ai.js';

const router = Router();

// AI Provider Status
router.get('/status', (req, res) => {
  const status = getAIProviderStatus();
  res.json({
    success: true,
    status,
  });
});

// Generate Lesson
router.post('/generate', async (req: AuthenticatedRequest, res) => {
  try {
    const {
      schoolLevel,
      grade,
      curriculum,
      country,
      subject,
      topic,
      language = 'French',
      difficulty = 'medium',
      lessonLength = 'detailed',
      slidesCount = 4,
      includeExercises = true,
      includeQuiz = true,
      forTeacher = false,
    } = req.body;

    if (!topic || !subject || !grade) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez préciser la matière, le niveau et le sujet du cours.',
      });
    }

    // Entitlement & Quota check if authenticated as student
    if (req.user && req.user.role === 'student') {
      const entitlement = checkStudentEntitlement(req.user, 'ai_generation');
      if (!entitlement.allowed) {
        return res.status(403).json({
          success: false,
          quotaExceeded: true,
          message: entitlement.reason,
        });
      }
    }

    const result = await generateLessonWithAI({
      schoolLevel: schoolLevel || 'middle',
      grade,
      curriculum: curriculum || 'moroccan-biof',
      country,
      subject,
      topic,
      language,
      difficulty,
      lessonLength,
      slidesCount: Number(slidesCount) || 4,
      includeExercises: Boolean(includeExercises),
      includeQuiz: Boolean(includeQuiz),
      forTeacher: Boolean(forTeacher),
    });

    // Save lesson automatically or prepare full record
    const lessonId = `lsn-${Date.now().toString(36)}`;
    const fullLesson: GeneratedLesson = {
      id: lessonId,
      ...result.lesson,
      createdAt: new Date().toISOString(),
      createdBy: req.user ? req.user.id : 'guest',
    };

    db.update(data => {
      data.lessons.unshift(fullLesson);
      // Increment quota for student
      if (req.user && req.user.role === 'student' && req.user.studentProfile) {
        const student = data.users.find(u => u.id === req.user!.id);
        if (student && student.studentProfile) {
          student.studentProfile.aiLessonsUsedThisMonth =
            (student.studentProfile.aiLessonsUsedThisMonth || 0) + 1;
        }
      }
    });

    res.json({
      success: true,
      lesson: fullLesson,
      providerUsed: result.providerUsed,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error generating lesson:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la génération pédagogique par l\'IA.',
      error: error.message,
    });
  }
});

// List saved lessons
router.get('/lessons', (req: AuthenticatedRequest, res) => {
  const lessons = db.get('lessons');
  res.json({
    success: true,
    lessons,
  });
});

// Get single lesson
router.get('/lessons/:id', (req, res) => {
  const lessons = db.get('lessons');
  const lesson = lessons.find(l => l.id === req.params.id);
  if (!lesson) {
    return res.status(404).json({ success: false, message: 'Leçon introuvable.' });
  }
  res.json({ success: true, lesson });
});

export default router;

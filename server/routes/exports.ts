import { Router } from 'express';
import { db } from '../db.js';
import { generateDocx, generatePdf, generatePptx } from '../exports.js';

const router = Router();

// Export PDF
router.get('/pdf/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lessons = db.get('lessons');
    const lesson = lessons.find(l => l.id === lessonId);

    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Leçon introuvable.' });
    }

    const pdfBuffer = generatePdf(lesson);

    const safeTitle = lesson.title.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 40);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="EduCraft-${safeTitle}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('PDF generation error:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la génération du PDF.' });
  }
});

// Export DOCX (Word)
router.get('/docx/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lessons = db.get('lessons');
    const lesson = lessons.find(l => l.id === lessonId);

    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Leçon introuvable.' });
    }

    const docxBuffer = await generateDocx(lesson);

    const safeTitle = lesson.title.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 40);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="EduCraft-${safeTitle}.docx"`);
    res.send(docxBuffer);
  } catch (err: any) {
    console.error('DOCX generation error:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la génération du document Word.' });
  }
});

// Export PPTX (PowerPoint)
router.get('/pptx/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lessons = db.get('lessons');
    const lesson = lessons.find(l => l.id === lessonId);

    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Leçon introuvable.' });
    }

    const pptxBuffer = await generatePptx(lesson);

    const safeTitle = lesson.title.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 40);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    res.setHeader('Content-Disposition', `attachment; filename="EduCraft-${safeTitle}.pptx"`);
    res.send(pptxBuffer);
  } catch (err: any) {
    console.error('PPTX generation error:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la génération de la présentation PowerPoint.' });
  }
});

export default router;

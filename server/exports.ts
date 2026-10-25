import { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, Packer } from 'docx';
import PptxGenJS from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import { GeneratedLesson } from './db.js';

export async function generateDocx(lesson: GeneratedLesson): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'EDUCRAFT AI STUDIO - FICHE PÉDAGOGIQUE OFFICIELLE', bold: true, size: 24, color: '0077B6' }),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: lesson.title, bold: true, size: 36, color: '0D3B66' }),
            ],
            spacing: { after: 160 },
          }),

          // Metadata block prominently displaying School Level, Subject, Country, Curriculum
          new Paragraph({
            children: [
              new TextRun({ text: 'MATIÈRE : ', bold: true, size: 22, color: '0D3B66' }),
              new TextRun({ text: `${lesson.subject.toUpperCase()}   |   `, size: 22 }),
              new TextRun({ text: 'SUJET : ', bold: true, size: 22, color: '0D3B66' }),
              new TextRun({ text: `${lesson.title}`, size: 22 }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'NIVEAU SCOLAIRE (SCHOOL LEVEL) : ', bold: true, size: 24, color: 'B7094C' }),
              new TextRun({ text: lesson.grade, bold: true, size: 24, color: '0D3B66' }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'PAYS : ', bold: true, size: 20 }),
              new TextRun({ text: `${lesson.country || 'Maroc (Morocco)'}   |   `, size: 20 }),
              new TextRun({ text: 'PROGRAMME : ', bold: true, size: 20 }),
              new TextRun({ text: `${lesson.curriculum}   |   `, size: 20 }),
              new TextRun({ text: 'LANGUE : ', bold: true, size: 20 }),
              new TextRun({ text: `${lesson.language}`, size: 20 }),
            ],
            spacing: { after: 200 },
          }),

          // Learning Objectives
          new Paragraph({
            children: [
              new TextRun({ text: 'Objectifs d\'apprentissage :', bold: true, size: 24, color: '0077B6' }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            text: lesson.objective,
            spacing: { after: 160 },
          }),

          // Prerequisites
          ...(lesson.prerequisites && lesson.prerequisites.length > 0 ? [
            new Paragraph({
              children: [new TextRun({ text: 'Prérequis Pédagogiques Indispensables :', bold: true, size: 24, color: '0D3B66' })],
              spacing: { after: 80 },
            }),
            ...lesson.prerequisites.map(p => new Paragraph({
              children: [new TextRun({ text: `• ${p}` })],
              spacing: { after: 60 },
            })),
          ] : []),

          // Introduction
          ...(lesson.introduction ? [
            new Paragraph({
              children: [new TextRun({ text: 'Introduction Générale au Cours :', bold: true, size: 24, color: '0D3B66' })],
              spacing: { before: 120, after: 80 },
            }),
            new Paragraph({
              text: lesson.introduction,
              spacing: { after: 200 },
            }),
          ] : []),

          // Chapters / Paragraphs
          ...lesson.paragraphs.flatMap(p => [
            new Paragraph({
              children: [new TextRun({ text: p.title, bold: true, size: 26, color: '0077B6' })],
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 180, after: 100 },
            }),
            new Paragraph({
              text: p.body,
              spacing: { after: 160 },
            }),
          ]),

          // Common Mistakes
          ...(lesson.commonMistakes && lesson.commonMistakes.length > 0 ? [
            new Paragraph({
              children: [new TextRun({ text: 'Erreurs Fréquentes & Pièges à Éviter', bold: true, size: 26, color: 'B7094C' })],
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 },
            }),
            ...lesson.commonMistakes.flatMap(cm => [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Erreur typique : ', bold: true, color: 'B7094C' }),
                  new TextRun({ text: cm.mistake }),
                ],
                spacing: { after: 40 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Bonne pratique : ', bold: true, color: '2E7D32' }),
                  new TextRun({ text: cm.correction }),
                ],
                spacing: { after: 40 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Explication didactique : ', italics: true }),
                  new TextRun({ text: cm.why, italics: true }),
                ],
                spacing: { after: 120 },
              }),
            ]),
          ] : []),

          // Practical Applications
          ...(lesson.practicalApplications && lesson.practicalApplications.length > 0 ? [
            new Paragraph({
              children: [new TextRun({ text: 'Applications Concrètes & Dans le Monde Réel', bold: true, size: 26, color: '0D3B66' })],
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 },
            }),
            ...lesson.practicalApplications.flatMap(pa => [
              new Paragraph({
                children: [
                  new TextRun({ text: `${pa.field} : `, bold: true, color: '0077B6' }),
                  new TextRun({ text: pa.description }),
                ],
                spacing: { after: 80 },
              }),
            ]),
          ] : []),

          // Vocabulary
          new Paragraph({
            children: [new TextRun({ text: 'Lexique et Vocabulaire Clé', bold: true, size: 26, color: '0D3B66' })],
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Terme', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Définition', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Exemple d\'usage', bold: true })] })] }),
                ],
              }),
              ...lesson.vocab.map(v => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: v.term })] }),
                  new TableCell({ children: [new Paragraph({ text: v.definition })] }),
                  new TableCell({ children: [new Paragraph({ text: v.example })] }),
                ],
              })),
            ],
          }),

          // Exercises
          new Paragraph({
            children: [new TextRun({ text: 'Exercices d\'Application Progressifs & Corrigé', bold: true, size: 26, color: '0D3B66' })],
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 240, after: 100 },
          }),
          ...lesson.exercises.flatMap((ex, i) => [
            new Paragraph({
              children: [
                new TextRun({ text: `Exercice ${i + 1}${ex.difficulty ? ` [Niveau: ${ex.difficulty.toUpperCase()}]` : ''} : `, bold: true }),
                new TextRun({ text: ex.question }),
              ],
              spacing: { after: 80 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Indice : ', italics: true, color: '666666' }),
                new TextRun({ text: ex.hint, italics: true, color: '666666' }),
              ],
              spacing: { after: 80 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Solution détaillée : ', bold: true, color: '2E7D32' }),
                new TextRun({ text: ex.solution }),
              ],
              spacing: { after: 160 },
            }),
          ]),

          // Quiz
          new Paragraph({
            children: [new TextRun({ text: 'Quiz d\'Évaluation Rapide', bold: true, size: 26, color: '0D3B66' })],
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          }),
          ...lesson.quiz.flatMap((q, qi) => [
            new Paragraph({
              children: [new TextRun({ text: `Q${qi + 1}. ${q.question}`, bold: true })],
              spacing: { after: 60 },
            }),
            ...q.options.map((opt, oi) => new Paragraph({
              text: `   [${String.fromCharCode(65 + oi)}] ${opt}`,
              spacing: { after: 40 },
            })),
            new Paragraph({
              children: [
                new TextRun({ text: `   Réponse correcte : ${String.fromCharCode(65 + q.answerIndex)}`, bold: true, color: '0077B6' }),
                new TextRun({ text: ` (${q.explanation})` }),
              ],
              spacing: { after: 140 },
            }),
          ]),

          // Lesson Summary
          ...(lesson.summary ? [
            new Paragraph({
              children: [new TextRun({ text: 'Synthèse & Mémento du Cours', bold: true, size: 26, color: '0D3B66' })],
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 80 },
            }),
            new Paragraph({
              text: lesson.summary,
              spacing: { after: 180 },
            }),
          ] : []),

          // Final Assessment
          ...(lesson.finalAssessment && lesson.finalAssessment.length > 0 ? [
            new Paragraph({
              children: [new TextRun({ text: 'Épreuve d\'Évaluation Finale de Maîtrise', bold: true, size: 26, color: '0D3B66' })],
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 80 },
            }),
            ...lesson.finalAssessment.flatMap((fa, fi) => [
              new Paragraph({
                children: [
                  new TextRun({ text: `Épreuve ${fi + 1} : `, bold: true }),
                  new TextRun({ text: fa.question }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Critères d\'évaluation : ', bold: true, color: '666666' }),
                  new TextRun({ text: fa.criteria }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Corrigé modèle : ', bold: true, color: '2E7D32' }),
                  new TextRun({ text: fa.solution }),
                ],
                spacing: { after: 160 },
              }),
            ]),
          ] : []),

          // Teacher Notes
          new Paragraph({
            children: [new TextRun({ text: 'Notes pour l\'Enseignant :', bold: true, color: '8B5CF6' })],
            spacing: { before: 180, after: 60 },
          }),
          new Paragraph({
            text: lesson.teacherNotes,
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

export async function generatePptx(lesson: GeneratedLesson): Promise<Buffer> {
  const pptx = new (PptxGenJS as any)();
  pptx.layout = 'LAYOUT_16x9';

  // 1. Opening Title Slide prominently displaying School Level
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: '0A192F' };
  titleSlide.addText('EDUCRAFT AI STUDIO - COURS OFFICIEL', {
    x: 0.8,
    y: 0.8,
    fontSize: 14,
    color: '00B4D8',
    bold: true,
  });
  titleSlide.addText(lesson.title, {
    x: 0.8,
    y: 1.6,
    w: 8.5,
    fontSize: 28,
    color: 'FFFFFF',
    bold: true,
  });
  titleSlide.addText(`MATIÈRE : ${lesson.subject.toUpperCase()}`, {
    x: 0.8,
    y: 2.8,
    fontSize: 16,
    color: '90E0EF',
    bold: true,
  });
  // Prominent School Level Badge
  titleSlide.addText(`NIVEAU SCOLAIRE (SCHOOL LEVEL) : ${lesson.grade}`, {
    x: 0.8,
    y: 3.4,
    w: 8.5,
    fontSize: 20,
    color: 'F72585',
    bold: true,
  });
  titleSlide.addText(`PAYS : ${lesson.country || 'Maroc'} | PROGRAMME : ${lesson.curriculum} | LANGUE : ${lesson.language}`, {
    x: 0.8,
    y: 4.2,
    fontSize: 13,
    color: 'CBD5E1',
  });
  titleSlide.addText(`Objectif : ${lesson.objective.slice(0, 140)}...`, {
    x: 0.8,
    y: 4.9,
    w: 8.5,
    fontSize: 12,
    color: '94A3B8',
    italic: true,
  });

  // 2. Introduction & Prerequisites Slide
  if (lesson.introduction || (lesson.prerequisites && lesson.prerequisites.length > 0)) {
    const introSlide = pptx.addSlide();
    introSlide.background = { color: 'F8FAFC' };
    introSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.9,
      fill: { color: '0D3B66' },
    });
    introSlide.addText(`Introduction & Prérequis • ${lesson.grade}`, {
      x: 0.8,
      y: 0.2,
      fontSize: 20,
      color: 'FFFFFF',
      bold: true,
    });
    if (lesson.introduction) {
      introSlide.addText('Contexte & Utilité :', {
        x: 0.8,
        y: 1.2,
        fontSize: 15,
        color: '0D3B66',
        bold: true,
      });
      introSlide.addText(lesson.introduction, {
        x: 0.8,
        y: 1.6,
        w: 8.4,
        fontSize: 13,
        color: '334155',
      });
    }
    if (lesson.prerequisites && lesson.prerequisites.length > 0) {
      introSlide.addText('Prérequis :', {
        x: 0.8,
        y: 3.2,
        fontSize: 15,
        color: '0D3B66',
        bold: true,
      });
      const prereqBullets = lesson.prerequisites.map(p => ({
        text: p,
        options: { fontSize: 13, color: '334155', bullet: true, breakLine: true },
      }));
      introSlide.addText(prereqBullets as any, {
        x: 0.8,
        y: 3.6,
        w: 8.4,
      });
    }
  }

  // 3. Content Slides
  if (lesson.slides && lesson.slides.length > 0) {
    lesson.slides.forEach(s => {
      const slide = pptx.addSlide();
      slide.background = { color: 'F8FAFC' };

      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.9,
        fill: { color: '0D3B66' },
      });

      slide.addText(s.title, {
        x: 0.8,
        y: 0.2,
        fontSize: 20,
        color: 'FFFFFF',
        bold: true,
      });

      slide.addText(`${lesson.grade} • ${s.category.toUpperCase()}`, {
        x: 6.5,
        y: 0.25,
        fontSize: 11,
        color: '00B4D8',
        bold: true,
      });

      const bulletItems = s.bulletPoints.map(bp => ({
        text: bp,
        options: { fontSize: 15, color: '1E293B', bullet: true, breakLine: true },
      }));

      slide.addText(bulletItems as any, {
        x: 1.0,
        y: 1.6,
        w: 8.0,
        h: 4.5,
      });
    });
  } else {
    // Generate slides from paragraphs
    lesson.paragraphs.forEach(p => {
      const slide = pptx.addSlide();
      slide.background = { color: 'F8FAFC' };
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.9,
        fill: { color: '0D3B66' },
      });
      slide.addText(p.title, {
        x: 0.8,
        y: 0.2,
        fontSize: 20,
        color: 'FFFFFF',
        bold: true,
      });
      slide.addText(`${lesson.grade}`, {
        x: 7.5,
        y: 0.25,
        fontSize: 11,
        color: '00B4D8',
        bold: true,
      });
      slide.addText(p.body, {
        x: 1.0,
        y: 1.6,
        w: 8.0,
        h: 4.5,
        fontSize: 14,
        color: '1E293B',
      });
    });
  }

  // 4. Common Mistakes Slide
  if (lesson.commonMistakes && lesson.commonMistakes.length > 0) {
    const mistakeSlide = pptx.addSlide();
    mistakeSlide.background = { color: 'FFF5F5' };
    mistakeSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.9,
      fill: { color: 'B7094C' },
    });
    mistakeSlide.addText(`Erreurs Fréquentes & Pièges à Éviter • ${lesson.grade}`, {
      x: 0.8,
      y: 0.2,
      fontSize: 20,
      color: 'FFFFFF',
      bold: true,
    });
    const items = lesson.commonMistakes.flatMap(cm => [
      { text: `Piège : ${cm.mistake}`, options: { bold: true, color: 'B7094C', bullet: true, fontSize: 14, breakLine: true } },
      { text: `Règle : ${cm.correction}`, options: { color: '2E7D32', fontSize: 13, breakLine: true } },
    ]);
    mistakeSlide.addText(items as any, {
      x: 1.0,
      y: 1.5,
      w: 8.0,
      h: 4.5,
    });
  }

  // 5. Quiz Slide
  if (lesson.quiz && lesson.quiz.length > 0) {
    const quizSlide = pptx.addSlide();
    quizSlide.background = { color: 'F1F5F9' };
    quizSlide.addText(`ÉVALUATION FORMATIVE (${lesson.grade})`, {
      x: 0.8,
      y: 0.5,
      fontSize: 22,
      color: '0D3B66',
      bold: true,
    });
    const q = lesson.quiz[0];
    quizSlide.addText(q.question, {
      x: 0.8,
      y: 1.3,
      w: 8.4,
      fontSize: 17,
      color: '0F172A',
      bold: true,
    });
    const optionsText = q.options.map((opt, idx) => ({
      text: `${String.fromCharCode(65 + idx)}) ${opt}`,
      options: { fontSize: 15, color: '334155', bullet: true, breakLine: true },
    }));
    quizSlide.addText(optionsText as any, {
      x: 1.0,
      y: 2.2,
      w: 8.0,
      h: 3.5,
    });
  }

  // 6. Summary Slide
  if (lesson.summary) {
    const sumSlide = pptx.addSlide();
    sumSlide.background = { color: 'F0FDF4' };
    sumSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.9,
      fill: { color: '166534' },
    });
    sumSlide.addText(`Synthèse du Cours • ${lesson.grade}`, {
      x: 0.8,
      y: 0.2,
      fontSize: 20,
      color: 'FFFFFF',
      bold: true,
    });
    sumSlide.addText(lesson.summary, {
      x: 1.0,
      y: 1.6,
      w: 8.0,
      h: 4.5,
      fontSize: 15,
      color: '1E293B',
      lineSpacing: 24,
    });
  }

  const nodeBuffer = await pptx.write({ outputType: 'nodebuffer' });
  return Buffer.isBuffer(nodeBuffer) ? nodeBuffer : Buffer.from(nodeBuffer as ArrayBuffer);
}

export function generatePdf(lesson: GeneratedLesson): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header Banner
  doc.setFillColor(13, 59, 102); // Deep Navy
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(0, 180, 216); // Bright Cyan
  doc.setFontSize(9);
  doc.text('EDUCRAFT AI STUDIO - FICHE PÉDAGOGIQUE OFFICIELLE', 14, 8);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(lesson.title.slice(0, 52), 14, 18);

  y = 35;

  // Prominent Metadata Block with exact School Level
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text(`MATIÈRE : ${lesson.subject.toUpperCase()}   |   SUJET : ${lesson.title.slice(0, 40)}`, 18, y + 6);

  // School level in bold highlight
  doc.setTextColor(183, 9, 76); // Bold Crimson
  doc.setFontSize(10);
  doc.text(`NIVEAU SCOLAIRE (SCHOOL LEVEL) : ${lesson.grade}`, 18, y + 12);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.text(`PAYS : ${lesson.country || 'Maroc'}  |  PROGRAMME : ${lesson.curriculum}  |  LANGUE : ${lesson.language}`, 18, y + 18);
  y += 28;

  // Objective Box
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setTextColor(3, 105, 161);
  doc.setFontSize(9);
  doc.text('OBJECTIFS PÉDAGOGIQUES :', 18, y + 5);
  doc.setTextColor(30, 41, 59);
  const objLines = doc.splitTextToSize(lesson.objective, pageWidth - 36);
  doc.text(objLines.slice(0, 2), 18, y + 10);
  y += 22;

  // Prerequisites & Introduction
  if (lesson.introduction) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setTextColor(13, 59, 102);
    doc.setFontSize(11);
    doc.text('Introduction au Cours :', 14, y);
    y += 5;
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    const introLines = doc.splitTextToSize(lesson.introduction, pageWidth - 28);
    doc.text(introLines, 14, y);
    y += introLines.length * 4.4 + 6;
  }

  // Chapters / Paragraphs
  lesson.paragraphs.forEach(p => {
    if (y > 245) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(13, 59, 102);
    doc.setFontSize(11);
    doc.text(p.title, 14, y);
    y += 5.5;

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    const bodyLines = doc.splitTextToSize(p.body, pageWidth - 28);
    doc.text(bodyLines, 14, y);
    y += bodyLines.length * 4.4 + 6;
  });

  // Common Mistakes
  if (lesson.commonMistakes && lesson.commonMistakes.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setTextColor(183, 9, 76);
    doc.setFontSize(11);
    doc.text('Erreurs Fréquentes & Pièges à Éviter', 14, y);
    y += 6;

    lesson.commonMistakes.forEach(cm => {
      if (y > 255) { doc.addPage(); y = 20; }
      doc.setFontSize(8.5);
      doc.setTextColor(183, 9, 76);
      doc.text(`• Piège : ${cm.mistake}`, 16, y);
      y += 4.5;
      doc.setTextColor(46, 125, 50);
      doc.text(`  Correction : ${cm.correction}`, 16, y);
      y += 4.5;
      doc.setTextColor(71, 85, 105);
      const whyLines = doc.splitTextToSize(`  Raison : ${cm.why}`, pageWidth - 32);
      doc.text(whyLines, 16, y);
      y += whyLines.length * 4.2 + 3;
    });
  }

  // Vocabulary Section
  if (lesson.vocab && lesson.vocab.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setTextColor(13, 59, 102);
    doc.setFontSize(11);
    doc.text('Vocabulaire & Définitions Clés', 14, y);
    y += 6;

    lesson.vocab.forEach(v => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(8.5);
      doc.setTextColor(2, 132, 199);
      doc.text(`• ${v.term} : `, 16, y);
      const defLines = doc.splitTextToSize(v.definition, pageWidth - 50);
      doc.setTextColor(51, 65, 85);
      doc.text(defLines, 48, y);
      y += Math.max(defLines.length * 4.2, 5.5);
    });
    y += 4;
  }

  // Exercises
  if (lesson.exercises && lesson.exercises.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setTextColor(13, 59, 102);
    doc.setFontSize(11);
    doc.text('Exercices d\'Application Progressifs', 14, y);
    y += 6;

    lesson.exercises.forEach((ex, i) => {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const qLines = doc.splitTextToSize(`Exercice ${i + 1}${ex.difficulty ? ` (${ex.difficulty.toUpperCase()})` : ''} : ${ex.question}`, pageWidth - 28);
      doc.text(qLines, 14, y);
      y += qLines.length * 4.4 + 2;

      doc.setTextColor(22, 101, 52);
      const solLines = doc.splitTextToSize(`Corrigé : ${ex.solution}`, pageWidth - 28);
      doc.text(solLines, 14, y);
      y += solLines.length * 4.2 + 5;
    });
  }

  // Quiz
  if (lesson.quiz && lesson.quiz.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setTextColor(13, 59, 102);
    doc.setFontSize(11);
    doc.text('Quiz d\'Auto-Évaluation', 14, y);
    y += 6;

    lesson.quiz.forEach((q, i) => {
      if (y > 245) { doc.addPage(); y = 20; }
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Q${i + 1}: ${q.question}`, 14, y);
      y += 4.5;

      q.options.forEach((opt, oi) => {
        const isCorrect = oi === q.answerIndex;
        doc.setTextColor(isCorrect ? 16 : 71, isCorrect ? 185 : 85, isCorrect ? 129 : 105);
        doc.text(`  [${String.fromCharCode(65 + oi)}] ${opt} ${isCorrect ? '(Correcte)' : ''}`, 16, y);
        y += 4;
      });
      y += 2.5;
    });
  }

  // Summary
  if (lesson.summary) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setTextColor(13, 59, 102);
    doc.setFontSize(11);
    doc.text('Synthèse & Retenir l\'Essentiel', 14, y);
    y += 5.5;
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8.5);
    const sumLines = doc.splitTextToSize(lesson.summary, pageWidth - 28);
    doc.text(sumLines, 14, y);
    y += sumLines.length * 4.2 + 5;
  }

  // Footer page number
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(`EduCraft AI Studio • ${lesson.grade} • Page ${i} sur ${totalPages}`, pageWidth - 70, 290);
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

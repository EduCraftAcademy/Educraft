import React, { useState } from 'react';
import { GeneratedLesson } from '../types';
import { downloadLessonFile } from '../api/client';
import {
  X,
  FileText,
  FileSpreadsheet,
  Presentation,
  BookOpen,
  CheckCircle,
  HelpCircle,
  GraduationCap,
  Layers,
  ChevronRight,
  Download,
  Award,
  AlertTriangle,
  Compass,
  FileCheck,
  ListChecks,
} from 'lucide-react';

interface LessonViewerModalProps {
  lesson: GeneratedLesson | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LessonViewerModal: React.FC<LessonViewerModalProps> = ({ lesson, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'mistakes' | 'vocab' | 'slides' | 'exercises' | 'quiz' | 'summary' | 'teacher'>('content');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!isOpen || !lesson) return null;

  const handleDownload = (format: 'pdf' | 'docx' | 'pptx') => {
    setDownloading(format);
    downloadLessonFile(lesson.id, format);
    setTimeout(() => setDownloading(null), 1500);
  };

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const calculateScore = () => {
    if (!lesson.quiz || lesson.quiz.length === 0) return 0;
    let correct = 0;
    lesson.quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answerIndex) correct++;
    });
    return Math.round((correct / lesson.quiz.length) * 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 md:p-6">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-600 text-white shadow-xs">
                {lesson.subject.toUpperCase()}
              </span>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-rose-600 text-white shadow-xs">
                NIVEAU SCOLAIRE : {lesson.grade}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {lesson.country || 'Maroc'} • {lesson.curriculum} • {lesson.language}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white line-clamp-1">{lesson.title}</h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Real Export Buttons */}
            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
              <button
                onClick={() => handleDownload('pdf')}
                disabled={downloading !== null}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50 cursor-pointer"
                title="Télécharger la fiche officielle en PDF"
              >
                <FileText className="w-3.5 h-3.5" />
                {downloading === 'pdf' ? 'Export...' : 'PDF'}
              </button>

              <button
                onClick={() => handleDownload('docx')}
                disabled={downloading !== null}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg hover:bg-slate-700 text-blue-300 transition disabled:opacity-50 cursor-pointer"
                title="Télécharger le document modifiable Word"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {downloading === 'docx' ? 'Export...' : 'Word'}
              </button>

              <button
                onClick={() => handleDownload('pptx')}
                disabled={downloading !== null}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg hover:bg-slate-700 text-amber-300 transition disabled:opacity-50 cursor-pointer"
                title="Télécharger la présentation PowerPoint"
              >
                <Presentation className="w-3.5 h-3.5" />
                {downloading === 'pptx' ? 'Export...' : 'PowerPoint'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center overflow-x-auto border-b border-slate-200 bg-slate-50 px-6 gap-1 text-xs sm:text-sm font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" /> Présentation & Prérequis
          </button>

          <button
            onClick={() => setActiveTab('content')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'content'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Chapitres du Cours ({lesson.paragraphs?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('mistakes')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'mistakes'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Pièges & Applications ({((lesson.commonMistakes?.length || 0) + (lesson.practicalApplications?.length || 0))})
          </button>

          <button
            onClick={() => setActiveTab('vocab')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'vocab'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" /> Vocabulaire ({lesson.vocab?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('slides')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'slides'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Presentation className="w-4 h-4" /> Diapositives ({lesson.slides?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('exercises')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'exercises'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Exercices ({lesson.exercises?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'quiz'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" /> Quiz ({lesson.quiz?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" /> Synthèse & Évaluation
          </button>

          <button
            onClick={() => setActiveTab('teacher')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'teacher'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Espace Enseignant
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Prominent Educational Identity Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <div className="text-cyan-400 font-extrabold uppercase tracking-widest text-[11px]">
                {lesson.subject.toUpperCase()} • COURS PÉDAGOGIQUE OFFICIEL
              </div>
              <div className="text-base sm:text-lg font-black text-white">
                Sujet : {lesson.title}
              </div>
              <div className="text-xs text-slate-300 flex flex-wrap gap-x-4 gap-y-1 pt-1 font-medium">
                <span><strong>Niveau Scolaire :</strong> <span className="text-amber-300 font-bold">{lesson.grade}</span></span>
                <span><strong>Pays :</strong> {lesson.country || 'Maroc'}</span>
                <span><strong>Programme :</strong> {lesson.curriculum}</span>
                <span><strong>Langue :</strong> {lesson.language}</span>
              </div>
            </div>
          </div>

          {/* TAB 0: OVERVIEW & PREREQUISITES */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Objective Banner */}
              <div className="p-5 bg-blue-50 border-l-4 border-blue-600 rounded-r-2xl space-y-1">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
                  Objectifs d'apprentissage visés
                </span>
                <p className="text-sm text-slate-800 font-medium leading-relaxed">{lesson.objective}</p>
              </div>

              {/* Introduction */}
              {lesson.introduction && (
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Compass className="w-5 h-5 text-indigo-600" />
                    Introduction & Contexte du Sujet
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{lesson.introduction}</p>
                </div>
              )}

              {/* Prerequisites */}
              {lesson.prerequisites && lesson.prerequisites.length > 0 && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-emerald-600" />
                    Prérequis Pédagogiques Indispensables
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assurez-vous que l'élève maîtrise ces notions avant d'aborder ce cours :
                  </p>
                  <ul className="space-y-2 text-xs font-medium text-slate-800">
                    {lesson.prerequisites.map((p, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: CONTENT (ALL DETAILED CHAPTERS) */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Corps du Cours & Notions Détaillées</h3>
                  <p className="text-xs text-slate-500">
                    {lesson.paragraphs.length} chapitres approfondis adaptés au niveau {lesson.grade}.
                  </p>
                </div>
              </div>

              {lesson.paragraphs.map((p, i) => (
                <div key={i} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    {p.title}
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{p.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: COMMON MISTAKES & PRACTICAL APPLICATIONS */}
          {activeTab === 'mistakes' && (
            <div className="space-y-6">
              {/* Common Mistakes */}
              {lesson.commonMistakes && lesson.commonMistakes.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                      Erreurs Fréquentes & Pièges Didactiques
                    </h3>
                    <p className="text-xs text-slate-500">
                      Les confusions typiques rencontrées chez les élèves et les réflexes pour les surmonter.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lesson.commonMistakes.map((cm, i) => (
                      <div key={i} className="p-5 rounded-2xl border border-rose-200 bg-rose-50/60 space-y-2.5">
                        <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase">
                          <span className="px-2 py-0.5 rounded-md bg-rose-200 text-rose-800">Piège #{i + 1}</span>
                        </div>
                        <div className="text-xs text-rose-950 font-bold">
                          {cm.mistake}
                        </div>
                        <div className="text-xs text-emerald-900 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-medium">
                          <strong>Bonne Pratique :</strong> {cm.correction}
                        </div>
                        <p className="text-[11px] text-slate-600 italic">
                          <strong>Pourquoi cette erreur ?</strong> {cm.why}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practical Applications */}
              {lesson.practicalApplications && lesson.practicalApplications.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Compass className="w-5 h-5 text-indigo-600" />
                      Applications Pratiques dans le Monde Réel
                    </h3>
                    <p className="text-xs text-slate-500">
                      Comment cette notion est utilisée dans la vie courante, la technologie et les métiers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lesson.practicalApplications.map((pa, i) => (
                      <div key={i} className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/50 space-y-2">
                        <h4 className="font-bold text-indigo-950 text-sm">{pa.field}</h4>
                        <p className="text-xs text-slate-700 leading-relaxed">{pa.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VOCABULARY */}
          {activeTab === 'vocab' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Termes clés et Définitions ({lesson.grade})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lesson.vocab?.map((v, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <h4 className="font-bold text-blue-900 text-sm">{v.term}</h4>
                    <p className="text-xs text-slate-700 leading-relaxed">{v.definition}</p>
                    <div className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200">
                      Exemple : {v.example}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SLIDES */}
          {activeTab === 'slides' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Présentation Diaporama de Classe</h3>
                  <p className="text-xs text-slate-500">Support prêt à projeter pour les enseignants et élèves.</p>
                </div>
                <button
                  onClick={() => handleDownload('pptx')}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer"
                >
                  <Presentation className="w-3.5 h-3.5" /> Télécharger .PPTX
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lesson.slides?.map((slide, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl border-2 border-slate-200 bg-linear-to-br from-slate-900 to-slate-800 text-white shadow-md relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
                      <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                        Slide {slide.slideNumber} • {slide.category}
                      </span>
                      <span className="text-[10px] text-amber-300 font-bold">{lesson.grade}</span>
                    </div>
                    <h4 className="text-base font-bold text-white mb-3">{slide.title}</h4>
                    <ul className="space-y-2 text-xs text-slate-200">
                      {slide.bulletPoints.map((bp, bidx) => (
                        <li key={bidx} className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PROGRESSIVE EXERCISES */}
          {activeTab === 'exercises' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Exercices d'Application & Problèmes Progressifs</h3>
              <p className="text-xs text-slate-500">
                Exercices gradués pour consolider pas à pas les compétences requises en {lesson.grade}.
              </p>

              {lesson.exercises?.map((ex, i) => (
                <div key={i} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      Exercice {i + 1} : {ex.question}
                    </span>
                    {ex.difficulty && (
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        ex.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-800' :
                        ex.difficulty === 'medium' ? 'bg-amber-100 text-amber-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {ex.difficulty === 'easy' ? 'Niveau 1 : Facile' : ex.difficulty === 'medium' ? 'Niveau 2 : Moyen' : 'Niveau 3 : Défi'}
                      </span>
                    )}
                  </div>

                  {ex.hint && (
                    <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      <strong>Indice pédagogique :</strong> {ex.hint}
                    </div>
                  )}

                  <details className="text-xs group">
                    <summary className="cursor-pointer text-blue-600 font-bold hover:underline inline-flex items-center gap-1">
                      Voir la solution détaillée
                    </summary>
                    <div className="mt-2 p-3.5 bg-emerald-50 text-emerald-950 rounded-xl border border-emerald-200 leading-relaxed font-mono text-xs whitespace-pre-line">
                      {ex.solution}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: INTERACTIVE QUIZ */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Test d'Évaluation Rapide</h3>
                  <p className="text-xs text-slate-500">Vérifiez la compréhension instantanée des notions clés.</p>
                </div>
                {quizSubmitted && (
                  <div className="px-4 py-2 bg-emerald-100 text-emerald-900 rounded-xl font-bold text-sm flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    Score : {calculateScore()}%
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {lesson.quiz?.map((q, qidx) => (
                  <div key={qidx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {qidx + 1}. {q.question}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options.map((opt, oidx) => {
                        const isSelected = selectedAnswers[qidx] === oidx;
                        const isCorrect = q.answerIndex === oidx;

                        let btnStyle = 'bg-white border-slate-200 hover:border-blue-400 text-slate-800';
                        if (quizSubmitted) {
                          if (isCorrect) {
                            btnStyle = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold';
                          } else if (isSelected && !isCorrect) {
                            btnStyle = 'bg-rose-100 border-rose-500 text-rose-900';
                          }
                        } else if (isSelected) {
                          btnStyle = 'bg-blue-100 border-blue-600 text-blue-900 font-semibold';
                        }

                        return (
                          <button
                            key={oidx}
                            onClick={() => handleSelectOption(qidx, oidx)}
                            className={`p-3 text-xs text-left rounded-xl border transition flex items-center justify-between cursor-pointer ${btnStyle}`}
                          >
                            <span>
                              <strong className="mr-1.5">{String.fromCharCode(65 + oidx)}.</strong> {opt}
                            </span>
                            {quizSubmitted && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs leading-relaxed border border-blue-200">
                        <strong>Explication :</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!quizSubmitted ? (
                <button
                  onClick={() => setQuizSubmitted(true)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-md cursor-pointer"
                >
                  Valider et Corriger le Quiz
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedAnswers({});
                    setQuizSubmitted(false);
                  }}
                  className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-sm rounded-xl transition cursor-pointer"
                >
                  Recommencer le Quiz
                </button>
              )}
            </div>
          )}

          {/* TAB 7: SUMMARY & FINAL ASSESSMENT */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Summary */}
              {lesson.summary && (
                <div className="p-6 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                  <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    Synthèse & Retenir l'Essentiel ({lesson.grade})
                  </h3>
                  <p className="text-sm text-emerald-950 leading-relaxed whitespace-pre-line">{lesson.summary}</p>
                </div>
              )}

              {/* Final Assessment */}
              {lesson.finalAssessment && lesson.finalAssessment.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    Épreuve d'Évaluation Finale de Maîtrise
                  </h3>
                  <p className="text-xs text-slate-500">
                    Problème de synthèse conçu pour évaluer si l'élève a atteint les compétences requises du niveau {lesson.grade}.
                  </p>

                  {lesson.finalAssessment.map((fa, i) => (
                    <div key={i} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                      <div className="font-bold text-slate-900 text-sm">
                        Épreuve : {fa.question}
                      </div>
                      <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <strong>Critères de notation :</strong> {fa.criteria}
                      </div>
                      <details className="text-xs group">
                        <summary className="cursor-pointer text-indigo-600 font-bold hover:underline inline-flex items-center gap-1">
                          Voir la solution modèle et barème
                        </summary>
                        <div className="mt-2 p-3.5 bg-indigo-50 text-indigo-950 rounded-xl border border-indigo-200 leading-relaxed font-mono text-xs whitespace-pre-line">
                          {fa.solution}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: TEACHER NOTES */}
          {activeTab === 'teacher' && (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl border border-purple-200 bg-purple-50 space-y-2">
                <h4 className="font-bold text-purple-900 text-sm flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-600" /> Recommandations Didactiques pour l'Enseignant ({lesson.grade})
                </h4>
                <p className="text-xs text-purple-950 leading-relaxed whitespace-pre-line">{lesson.teacherNotes}</p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Alignement Curriculaire & Références Officielles
                </h4>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                  {lesson.references?.map((ref, idx) => (
                    <li key={idx}>{ref}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Fiche certifiée EduCraft AI Studio • Niveau : <strong className="text-slate-900">{lesson.grade}</strong> • {lesson.country || 'Maroc'} ({lesson.curriculum})
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

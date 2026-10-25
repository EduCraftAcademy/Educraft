import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiApi, curriculumApi, downloadLessonFile } from '../api/client';
import { GeneratedLesson, Curriculum } from '../types';
import { LessonViewerModal } from '../components/LessonViewerModal';
import {
  Sparkles,
  BookOpen,
  Download,
  FileText,
  FileSpreadsheet,
  Presentation,
  CheckCircle,
  AlertCircle,
  Layers,
  ArrowRight,
  Filter,
  Cpu,
} from 'lucide-react';

export const AILessonStudioView: React.FC = () => {
  const { user } = useAuth();
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>('moroccan-biof');
  const [country, setCountry] = useState<string>('Maroc (Morocco)');
  const [selectedLevel, setSelectedLevel] = useState<'primary' | 'middle' | 'high'>('middle');
  const [grade, setGrade] = useState<string>('3ème Année Collège (3AC / Brevet)');
  const [subject, setSubject] = useState<string>('Mathématiques');
  const [topic, setTopic] = useState<string>('Le Théorème de Pythagore et sa Réciproque');
  const [language, setLanguage] = useState<string>('French');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'advanced'>('medium');
  const [lessonLength, setLessonLength] = useState<'short' | 'medium' | 'detailed'>('detailed');
  const [slidesCount, setSlidesCount] = useState<number>(4);
  const [includeExercises, setIncludeExercises] = useState<boolean>(true);
  const [includeQuiz, setIncludeQuiz] = useState<boolean>(true);
  const [forTeacher, setForTeacher] = useState<boolean>(false);

  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLesson, setCurrentLesson] = useState<GeneratedLesson | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [savedLessons, setSavedLessons] = useState<GeneratedLesson[]>([]);
  const [aiStatus, setAiStatus] = useState<any>(null);

  // Request race-condition counter
  const activeRequestId = useRef<number>(0);

  useEffect(() => {
    curriculumApi.getCurricula().then(res => {
      if (res.success && res.curricula.length > 0) {
        setCurricula(res.curricula);
      }
    });

    aiApi.getLessons().then(res => {
      if (res.success) setSavedLessons(res.lessons);
    });

    aiApi.getStatus().then(res => {
      if (res.success) setAiStatus(res.status);
    });
  }, []);

  const activeCurriculum = curricula.find(c => c.id === selectedCurriculumId) || curricula[0];
  const availableGrades = activeCurriculum?.grades.filter(g => g.level === selectedLevel) || [];
  const availableSubjects = activeCurriculum?.subjects || [];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Veuillez préciser le sujet ou le chapitre de la leçon.');
      return;
    }

    const requestId = ++activeRequestId.current;
    const submittedTopic = topic.trim();
    const submittedSubject = subject;
    const submittedGrade = grade;
    const submittedCurriculum = selectedCurriculumId;
    const submittedLanguage = language;

    // Temporary development diagnostic logs
    console.log(`[AI-DIAGNOSTIC-CLIENT] >>> [Req #${requestId}] Starting lesson generation`);
    console.log(`[AI-DIAGNOSTIC-CLIENT] Submitted values:`, {
      topic: submittedTopic,
      subject: submittedSubject,
      grade: submittedGrade,
      curriculum: submittedCurriculum,
      language: submittedLanguage,
      level: selectedLevel,
    });
    console.log(`[AI-DIAGNOSTIC-CLIENT] Active Provider & Model:`, aiStatus ? `${aiStatus.activeProvider} (${aiStatus.activeModel})` : 'Querying status...');

    setError(null);
    setGenerating(true);
    // Explicitly clear current lesson state so stale data cannot be displayed
    setCurrentLesson(null);

    const startTime = Date.now();
    try {
      const res = await aiApi.generateLesson({
        schoolLevel: selectedLevel,
        grade: submittedGrade,
        curriculum: submittedCurriculum,
        country: country.trim() || 'Maroc (Morocco)',
        subject: submittedSubject,
        topic: submittedTopic,
        language: submittedLanguage,
        difficulty,
        lessonLength: 'detailed',
        slidesCount,
        includeExercises,
        includeQuiz,
        forTeacher,
      });

      const elapsed = Date.now() - startTime;
      console.log(`[AI-DIAGNOSTIC-CLIENT] <<< [Req #${requestId}] HTTP 200 Response received in ${elapsed}ms:`, {
        providerUsed: res.providerUsed,
        modelUsed: res.modelUsed,
        generatedTitle: res.lesson?.title,
        belongsToCurrentRequest: requestId === activeRequestId.current,
      });

      // Stale request guard: ensure an older slower request does not overwrite the result of a newer one
      if (requestId !== activeRequestId.current) {
        console.warn(`[AI-DIAGNOSTIC-CLIENT] Discarding response from request #${requestId} because a newer request (#${activeRequestId.current}) is in flight.`);
        return;
      }

      if (res.success && res.lesson) {
        setCurrentLesson(res.lesson);
        setIsViewerOpen(true);
        // refresh saved lessons list
        aiApi.getLessons().then(lRes => {
          if (lRes.success) setSavedLessons(lRes.lessons);
        });
      }
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      console.error(`[AI-DIAGNOSTIC-CLIENT] [Req #${requestId}] Request failed after ${elapsed}ms:`, err.message || err);
      if (requestId === activeRequestId.current) {
        setError(err.message || 'Erreur lors de la génération pédagogique.');
      }
    } finally {
      if (requestId === activeRequestId.current) {
        setGenerating(false);
      }
    }
  };

  const quickTopicSuggestions = [
    'Théorème de Pythagore et sa Réciproque',
    'Systèmes de deux équations à deux inconnues',
    'Oxydation des métaux dans l\'air',
    'Solutions acides et basiques (Mesure du pH)',
    'La Photosynthèse et nutrition des végétaux',
    'Les Figures de style dans l\'œuvre littéraire',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-cyan-300">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">
              Générateur Pédagogique Intelligent
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Studio de Création de Cours IA</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Créez des cours complets, des diapositives de présentation, des exercices avec solutions et des quiz autocorrigés conformes aux programmes officiels.
          </p>
        </div>

        {/* Quota / Plan Info */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-xs space-y-1 shrink-0">
          <div className="text-slate-300">Forfait Actif :</div>
          <div className="text-base font-extrabold text-cyan-300 capitalize">
            {user?.studentProfile?.subscriptionPlanId || 'Accès Standard'}
          </div>
          {user?.studentProfile && (
            <div className="text-[11px] text-slate-300 pt-1 border-t border-white/10">
              Leçons générées ce mois-ci :{' '}
              <strong className="text-white">{user.studentProfile.aiLessonsUsedThisMonth || 0}</strong>
              {user.studentProfile.subscriptionPlanId === 'free' && ' / 3 max'}
            </div>
          )}
        </div>
      </div>

      {/* Main Generator Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleGenerate} className="lg:col-span-2 space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Paramètres de la Ressource Pédagogique
            </h2>
            {aiStatus && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                Moteur : <strong className="text-slate-900">{aiStatus.activeProvider === 'gemini' ? 'Google Gemini' : 'OpenRouter'}</strong>
                <span className="font-mono text-indigo-700 text-[10px]">({aiStatus.activeModel})</span>
              </span>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Curriculum, Country & School Level */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Système / Programme
              </label>
              <select
                value={selectedCurriculumId}
                onChange={e => {
                  const newId = e.target.value;
                  setSelectedCurriculumId(newId);
                  if (newId.includes('french')) {
                    setCountry('France (AEFE)');
                  } else {
                    setCountry('Maroc (Morocco)');
                  }
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 font-medium"
              >
                {curricula.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pays de Référence
              </label>
              <input
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="Ex: Maroc (Morocco), France..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cycle Scolaire
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
                {(['primary', 'middle', 'high'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setSelectedLevel(lvl);
                      const matching = activeCurriculum?.grades.find(g => g.level === lvl);
                      if (matching) setGrade(matching.name);
                    }}
                    className={`py-1.5 rounded-lg transition capitalize ${
                      selectedLevel === lvl ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    {lvl === 'primary' ? 'Primaire' : lvl === 'middle' ? 'Collège' : 'Lycée'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Grade & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Classe / Niveau Exact
              </label>
              <select
                value={grade}
                onChange={e => setGrade(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 font-medium"
              >
                {availableGrades.map(g => (
                  <option key={g.id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Matière
              </label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 font-medium"
              >
                {availableSubjects.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.icon} {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic Input with suggestions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Titre du Sujet ou Thème du Cours
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Ex: Le Théorème de Pythagore, Les Fonctions Linéaires..."
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-hidden focus:border-blue-600 font-medium"
            />
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Suggestions :</span>
              {quickTopicSuggestions.slice(0, 3).map((sugg, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTopic(sugg)}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  {sugg}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Configurations */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Langue de Cours
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="French">Français</option>
                <option value="Arabic">Arabe (العربية)</option>
                <option value="English">Anglais</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Difficulté
              </label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="easy">Facile (Initiation)</option>
                <option value="medium">Moyen (Standard)</option>
                <option value="advanced">Avancé (Examen/Concours)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Diapositives PPT
              </label>
              <select
                value={slidesCount}
                onChange={e => setSlidesCount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value={2}>2 diapos (Synthèse)</option>
                <option value={4}>4 diapos (Recommandé)</option>
                <option value={6}>6 diapos (Détaillé)</option>
              </select>
            </div>
          </div>

          {/* Checkbox Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeExercises}
                onChange={e => setIncludeExercises(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <span>Exercices & Corrigés</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeQuiz}
                onChange={e => setIncludeQuiz(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <span>Quiz d'Évaluation Rapide</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={forTeacher}
                onChange={e => setForTeacher(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-slate-300"
              />
              <span>Guide Pédagogique Enseignant</span>
            </label>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={generating}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Génération Pédagogique par l'IA en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Générer la Leçon & les Diapositives
              </>
            )}
          </button>
        </form>

        {/* Saved Lessons Archive & Export Library */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Leçons Récemment Créées
            </h3>
            <span className="text-xs text-slate-500">{savedLessons.length} fiches</span>
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {savedLessons.map(lsn => (
              <div
                key={lsn.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    {lsn.subject}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                    {lsn.grade}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{lsn.country || 'Maroc'}</span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{lsn.title}</h4>

                <p className="text-xs text-slate-500 line-clamp-2">{lsn.objective}</p>

                {/* Actions: View and Download buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setCurrentLesson(lsn);
                      setIsViewerOpen(true);
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
                  >
                    Ouvrir <ArrowRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => downloadLessonFile(lsn.id, 'pdf')}
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded transition"
                      title="Télécharger PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadLessonFile(lsn.id, 'docx')}
                      className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition"
                      title="Télécharger Word"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadLessonFile(lsn.id, 'pptx')}
                      className="p-1.5 hover:bg-amber-50 text-amber-600 rounded transition"
                      title="Télécharger PowerPoint"
                    >
                      <Presentation className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lesson Viewer Modal */}
      <LessonViewerModal
        lesson={currentLesson}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />
    </div>
  );
};

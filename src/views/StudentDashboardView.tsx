import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { classesApi, teacherApi, aiApi } from '../api/client';
import { ScheduledClass, HomeworkAssignment, GeneratedLesson } from '../types';
import { ClassroomModal } from '../components/ClassroomModal';
import { LessonViewerModal } from '../components/LessonViewerModal';
import {
  BookOpen,
  Video,
  FileCheck2,
  Sparkles,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  Award,
  AlertCircle,
} from 'lucide-react';

interface StudentDashboardViewProps {
  onNavigate: (view: string) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [homework, setHomework] = useState<HomeworkAssignment[]>([]);
  const [recentLessons, setRecentLessons] = useState<GeneratedLesson[]>([]);
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<GeneratedLesson | null>(null);
  const [isLessonOpen, setIsLessonOpen] = useState(false);
  const [submitHwId, setSubmitHwId] = useState<string | null>(null);
  const [hwContent, setHwContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    classesApi.getTimetable().then(res => {
      if (res.success) setClasses(res.classes);
    });

    teacherApi.getWorkspace().then(res => {
      if (res.success) setHomework(res.homework);
    });

    aiApi.getLessons().then(res => {
      if (res.success) setRecentLessons(res.lessons.slice(0, 4));
    });
  }, []);

  const profile = user?.studentProfile;
  const isPaidPlan = profile?.subscriptionPlanId && profile.subscriptionPlanId !== 'free';

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitHwId || !hwContent.trim()) return;
    setSubmitting(true);
    try {
      await teacherApi.submitHomework({
        homeworkId: submitHwId,
        content: hwContent.trim(),
      });
      alert('Devoir soumis avec succès à votre enseignant !');
      setSubmitHwId(null);
      setHwContent('');
      // refresh workspace
      const res = await teacherApi.getWorkspace();
      if (res.success) setHomework(res.homework);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Welcome Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 text-white">
              Espace Élève
            </span>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-400 text-slate-950">
              Forfait {(profile?.subscriptionPlanId || 'FREE').toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black">
            Bonjour, {user?.name || 'Élève'} ! 👋
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Niveau : <strong>{profile?.grade || '3ème Année Collège'}</strong> • Programme :{' '}
            <strong>{profile?.curriculum || 'Moroccan BIOF'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('ai-studio')}
            className="px-5 py-3 rounded-xl bg-white text-blue-800 font-bold text-xs hover:bg-blue-50 transition shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-600" /> Générer un Cours IA
          </button>
          <button
            onClick={() => onNavigate('live-classes')}
            className="px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white font-bold text-xs transition border border-white/20 flex items-center gap-2 cursor-pointer"
          >
            <Video className="w-4 h-4 text-red-400" /> Mes Cours en Direct
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Live Classes & Homework */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Live Classes */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-red-600" />
                Mes Prochains Cours en Direct avec Enseignant
              </h2>
              <span className="text-xs font-semibold text-slate-500">{classes.length} cours</span>
            </div>

            {classes.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                Aucun cours assigné pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {classes.map(cls => (
                  <div
                    key={cls.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-blue-400 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                          {cls.subject}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {cls.startTime} - {cls.endTime}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{cls.title}</h3>
                      <p className="text-xs text-slate-600">
                        Enseignant : <strong>{cls.teacherName}</strong> • Salle :{' '}
                        <code className="text-[11px] text-blue-700">{cls.videoRoomId}</code>
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedClass(cls);
                        setIsClassOpen(true);
                      }}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Video className="w-4 h-4" /> Entrer en Classe
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Homework & Submissions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                Devoirs & Travaux Dirigés
              </h2>
            </div>

            <div className="space-y-3">
              {homework.map(hw => {
                const submission = hw.submissions.find(s => s.studentId === user?.id);
                return (
                  <div
                    key={hw.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          {hw.subject}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{hw.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{hw.instructions}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-slate-500 block">
                          À rendre pour le {hw.dueDate}
                        </span>
                        {submission ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1">
                            <CheckCircle className="w-3 h-3" /> Rendu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mt-1">
                            <Clock className="w-3 h-3" /> À faire
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Feedback if graded */}
                    {submission && typeof submission.grade === 'number' && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1 mt-2">
                        <div className="flex items-center justify-between font-bold text-blue-900">
                          <span>Note obtenue : {submission.grade}/20</span>
                          <Award className="w-4 h-4 text-blue-600" />
                        </div>
                        {submission.feedback && (
                          <p className="text-slate-700 italic">« {submission.feedback} »</p>
                        )}
                      </div>
                    )}

                    {!submission && (
                      <div className="pt-2">
                        <button
                          onClick={() => setSubmitHwId(hw.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                        >
                          Rendre mon devoir
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: AI Lessons & Subjects */}
        <div className="space-y-6">
          {/* Enrolled Subjects */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Matières du Programme
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
              {profile?.enrolledSubjects?.map((sub, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span className="truncate">{sub}</span>
                </div>
              )) || [
                <div key="1" className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">Mathématiques</div>,
                <div key="2" className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">Physique-Chimie</div>,
                <div key="3" className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">SVT</div>,
                <div key="4" className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">Français</div>,
              ]}
            </div>
          </div>

          {/* Quick AI Lesson Launcher */}
          <div className="bg-linear-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md space-y-3">
            <div className="flex items-center gap-2 text-cyan-300">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold text-sm">Besoin d'une explication immédiate ?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Le Studio IA vous génère en 10 secondes un résumé structuré avec exercices résolus et quiz sur n'importe quel chapitre.
            </p>
            <button
              onClick={() => onNavigate('ai-studio')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              Lancer le Générateur <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Saved Lessons */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Derniers Cours Consultés
            </h3>
            <div className="space-y-2">
              {recentLessons.map(l => (
                <button
                  key={l.id}
                  onClick={() => {
                    setSelectedLesson(l);
                    setIsLessonOpen(true);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-300 bg-slate-50/50 transition flex items-center justify-between"
                >
                  <div className="truncate mr-2">
                    <span className="text-[10px] font-bold text-blue-600 block">{l.subject}</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">{l.title}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Homework submission modal */}
      {submitHwId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Rendre le devoir</h3>
            <form onSubmit={handleSubmitHomework} className="space-y-3">
              <textarea
                rows={5}
                required
                placeholder="Rédigez votre réponse ou collez vos calculs détaillés..."
                value={hwContent}
                onChange={e => setHwContent(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmitHwId(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                >
                  {submitting ? 'Envoi...' : 'Envoyer au Professeur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Classroom Modal */}
      <ClassroomModal
        isOpen={isClassOpen}
        onClose={() => setIsClassOpen(false)}
        classData={selectedClass}
      />

      {/* Lesson Viewer Modal */}
      <LessonViewerModal
        isOpen={isLessonOpen}
        onClose={() => setIsLessonOpen(false)}
        lesson={selectedLesson}
      />
    </div>
  );
};

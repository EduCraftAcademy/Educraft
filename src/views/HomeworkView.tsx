import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { teacherApi } from '../api/client';
import { HomeworkAssignment } from '../types';
import {
  FileCheck2,
  Calendar,
  CheckCircle,
  Clock,
  Award,
  Plus,
  Send,
  MessageSquare,
} from 'lucide-react';

export const HomeworkView: React.FC = () => {
  const { user } = useAuth();
  const [homework, setHomework] = useState<HomeworkAssignment[]>([]);
  const [submitHwId, setSubmitHwId] = useState<string | null>(null);
  const [hwContent, setHwContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadHomework();
  }, [user]);

  const loadHomework = async () => {
    const res = await teacherApi.getWorkspace();
    if (res.success) setHomework(res.homework);
  };

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'owner';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitHwId || !hwContent.trim()) return;
    setSubmitting(true);
    try {
      await teacherApi.submitHomework({
        homeworkId: submitHwId,
        content: hwContent.trim(),
      });
      alert('Votre copie a été envoyée avec succès à votre enseignant !');
      setSubmitHwId(null);
      setHwContent('');
      loadHomework();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-emerald-800 via-teal-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200">
              Espace Devoirs & Travaux Dirigés
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black">Devoirs & Évaluations Continues</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Remise de devoirs en ligne, corrections détaillées par les professeurs d'EduCraft et notation sur 20 conforme au système officiel marocain.
          </p>
        </div>
      </div>

      {/* Homework List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {homework.map(hw => {
          const submission = hw.submissions.find(s => s.studentId === user?.id);
          return (
            <div
              key={hw.id}
              className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    {hw.subject}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
                    <Calendar className="w-3.5 h-3.5" /> À rendre : {hw.dueDate}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{hw.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{hw.instructions}</p>

                {/* Submission status for student */}
                {!isTeacher && (
                  <div className="pt-2 border-t border-slate-100">
                    {submission ? (
                      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                          <span className="flex items-center gap-1 text-emerald-700">
                            <CheckCircle className="w-4 h-4" /> Devoir rendu
                          </span>
                          {typeof submission.grade === 'number' && (
                            <span className="text-sm font-black text-blue-900 bg-white px-2.5 py-0.5 rounded-md shadow-xs">
                              Note : {submission.grade} / 20
                            </span>
                          )}
                        </div>
                        {submission.feedback && (
                          <div className="text-xs text-slate-700 italic pt-1">
                            Remarque de l'enseignant : « {submission.feedback} »
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> En attente de remise
                        </span>
                        <button
                          onClick={() => setSubmitHwId(hw.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
                        >
                          Rendre mon travail
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Submissions count for teacher */}
                {isTeacher && (
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                    Total copies reçues : <strong>{hw.submissions.length}</strong> élève(s)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Homework Modal */}
      {submitHwId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Rendre le devoir</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                rows={6}
                required
                placeholder="Rédigez ici vos réponses, démonstrations ou collez vos résolutions d'exercices..."
                value={hwContent}
                onChange={e => setHwContent(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  {submitting ? 'Envoi...' : 'Transmettre à l\'Enseignant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

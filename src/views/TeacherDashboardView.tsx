import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { teacherApi, classesApi } from '../api/client';
import { ScheduledClass, HomeworkAssignment, TeacherSalaryPayment } from '../types';
import { ClassroomModal } from '../components/ClassroomModal';
import {
  GraduationCap,
  Calendar,
  FileCheck2,
  Users,
  Video,
  Plus,
  Award,
  CheckCircle,
  Landmark,
  Clock,
  Sparkles,
} from 'lucide-react';

interface TeacherDashboardViewProps {
  onNavigate: (view: string) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [homework, setHomework] = useState<HomeworkAssignment[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<TeacherSalaryPayment[]>([]);
  const [activeClassForVideo, setActiveClassForVideo] = useState<ScheduledClass | null>(null);
  const [isClassroomOpen, setIsClassroomOpen] = useState(false);

  // Homework creation state
  const [isCreateHwOpen, setIsCreateHwOpen] = useState(false);
  const [hwTitle, setHwTitle] = useState('');
  const [hwSubject, setHwSubject] = useState('Mathématiques');
  const [hwDueDate, setHwDueDate] = useState('2026-10-30');
  const [hwInstructions, setHwInstructions] = useState('');

  // Grading state
  const [gradingSub, setGradingSub] = useState<{ hwId: string; studentId: string; studentName: string } | null>(null);
  const [gradeInput, setGradeInput] = useState<number>(18);
  const [feedbackInput, setFeedbackInput] = useState<string>('Très bon raisonnement et calculs bien justifiés.');

  useEffect(() => {
    loadWorkspace();
  }, [user]);

  const loadWorkspace = async () => {
    try {
      const res = await teacherApi.getWorkspace();
      if (res.success) {
        setClasses(res.classes);
        setHomework(res.homework);
        setEnrolledStudents(res.enrolledStudents);
        setSalaryPayments(res.salaryPayments);
      }
    } catch (e) {
      console.warn('Teacher workspace load error:', e);
    }
  };

  const profile = user?.teacherProfile;

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim() || !hwInstructions.trim()) return;

    await teacherApi.createHomework({
      title: hwTitle.trim(),
      subject: hwSubject,
      dueDate: hwDueDate,
      instructions: hwInstructions.trim(),
    });

    setIsCreateHwOpen(false);
    setHwTitle('');
    setHwInstructions('');
    loadWorkspace();
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSub) return;

    await teacherApi.gradeSubmission({
      homeworkId: gradingSub.hwId,
      studentId: gradingSub.studentId,
      grade: Number(gradeInput),
      feedback: feedbackInput.trim(),
    });

    setGradingSub(null);
    loadWorkspace();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Teacher Cockpit Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-blue-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300">
              Espace Professoral EduCraft
            </span>
            <span className="text-xs text-slate-300">
              Statut : <strong className="text-emerald-400 capitalize">{profile?.employmentStatus || 'Salarié Titulaire'}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black">{user?.name || 'Professeur'}</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Matières enseignées : <strong>{profile?.subjectsTaught?.join(', ') || 'Mathématiques'}</strong> • Charge hebdomadaire :{' '}
            <strong>{profile?.weeklyAvailabilityHours || 24} heures / semaine</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('ai-studio')}
            className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Préparer une Leçon IA
          </button>
          <button
            onClick={() => setIsCreateHwOpen(true)}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Assigner un Devoir
          </button>
        </div>
      </div>

      {/* Teacher KPIs & Fixed Salary Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fixed Salary */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Rémunération Mensuelle Fixe</span>
            <Landmark className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {profile?.monthlySalaryMAD?.toLocaleString('fr-FR') || '12 000'} MAD
          </div>
          <span className="text-[11px] text-slate-500">
            Salaire garanti net mensuel versé par EduCraft
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Classes Assignées</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{classes.length} groupes</div>
          <span className="text-[11px] text-emerald-600 font-semibold">Emploi du temps actif</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Élèves Suivis</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{enrolledStudents.length} élèves</div>
          <span className="text-[11px] text-slate-500">Groupes de 4 à 20 élèves</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Devoirs à Corriger</span>
            <FileCheck2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {homework.flatMap(h => h.submissions).filter(s => typeof s.grade !== 'number').length}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold">Copies en attente</span>
        </div>
      </div>

      {/* Main Grid: Scheduled Classes & Homework Grading */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Classes Scheduled */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-red-600" />
              Mes Classes Virtuelles Programmées
            </h3>
            <span className="text-xs text-slate-500">{classes.length} cours</span>
          </div>

          <div className="space-y-3">
            {classes.map(cls => (
              <div
                key={cls.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {cls.subject}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {cls.startTime} - {cls.endTime}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{cls.title}</h4>
                  <p className="text-xs text-slate-500">
                    Capacité : {cls.enrolledStudentIds.length} / {cls.maxCapacity} inscrits • Salle : {cls.videoRoomId}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setActiveClassForVideo(cls);
                    setIsClassroomOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Video className="w-4 h-4" /> Démarrer la Salle
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Homework Management & Grading */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
              Correction des Devoirs & Notation
            </h3>
          </div>

          <div className="space-y-3">
            {homework.map(hw => (
              <div key={hw.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{hw.subject}</span>
                    <h4 className="font-bold text-slate-900 text-sm">{hw.title}</h4>
                    <p className="text-xs text-slate-600">{hw.instructions}</p>
                  </div>
                  <span className="text-[10px] text-slate-400">Échéance : {hw.dueDate}</span>
                </div>

                {/* Submissions list */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Copies Reçues ({hw.submissions.length}) :
                  </span>

                  {hw.submissions.length === 0 ? (
                    <div className="text-xs text-slate-500 italic">Aucune copie rendue pour le moment.</div>
                  ) : (
                    hw.submissions.map((sub, sidx) => (
                      <div
                        key={sidx}
                        className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-slate-900">{sub.studentName}</strong>
                          <p className="text-slate-600 text-[11px] line-clamp-1 mt-0.5">{sub.content}</p>
                        </div>

                        {typeof sub.grade === 'number' ? (
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-blue-900 bg-blue-100 px-2.5 py-1 rounded-md text-xs">
                              {sub.grade} / 20
                            </span>
                            <button
                              onClick={() => {
                                setGradingSub({ hwId: hw.id, studentId: sub.studentId, studentName: sub.studentName });
                                setGradeInput(sub.grade || 18);
                                setFeedbackInput(sub.feedback || '');
                              }}
                              className="text-xs text-blue-600 hover:underline font-semibold"
                            >
                              Modifier
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setGradingSub({ hwId: hw.id, studentId: sub.studentId, studentName: sub.studentName });
                              setGradeInput(18);
                              setFeedbackInput('Bonne démarche globale.');
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-xs"
                          >
                            Corriger
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Salary & Employment Record Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-indigo-600" />
          Relevé de Rémunération Mensuelle & Virement
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Mois d'Exercice</th>
                <th className="p-3">Montant Fixe Contractuel</th>
                <th className="p-3">Référence Virement</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Date de Virement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {salaryPayments.map(sp => (
                <tr key={sp.id}>
                  <td className="p-3 font-bold text-slate-900">{sp.month}</td>
                  <td className="p-3 font-bold text-blue-900">{sp.amountMAD.toLocaleString('fr-FR')} MAD</td>
                  <td className="p-3 font-mono text-slate-600">{sp.reference}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sp.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {sp.status === 'paid' ? 'Virement Exécuté' : 'Programmé'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{sp.paidAt ? new Date(sp.paidAt).toLocaleDateString('fr-FR') : 'Fin du mois'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Homework Modal */}
      {isCreateHwOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Assigner un Nouveau Devoir</h3>
            <form onSubmit={handleCreateHomework} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Titre du Devoir</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Devoir Maison N°2 - Calcul vectoriel"
                  value={hwTitle}
                  onChange={e => setHwTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Matière</label>
                  <select
                    value={hwSubject}
                    onChange={e => setHwSubject(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                  >
                    <option value="Mathématiques">Mathématiques</option>
                    <option value="Physique-Chimie">Physique-Chimie</option>
                    <option value="SVT">SVT</option>
                    <option value="Français">Français</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date d'Échéance</label>
                  <input
                    type="date"
                    value={hwDueDate}
                    onChange={e => setHwDueDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Instructions</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Détaillez les exercices à résoudre, consignes de présentation..."
                  value={hwInstructions}
                  onChange={e => setHwInstructions(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateHwOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                >
                  Publier aux Élèves
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Notation : {gradingSub.studentName}</h3>
            <form onSubmit={handleSaveGrade} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Note officielle (/20)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="20"
                  required
                  value={gradeInput}
                  onChange={e => setGradeInput(parseFloat(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-bold text-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Appréciation Pédagogique</label>
                <textarea
                  rows={3}
                  required
                  value={feedbackInput}
                  onChange={e => setFeedbackInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingSub(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Enregistrer la Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Classroom Modal */}
      <ClassroomModal
        isOpen={isClassroomOpen}
        onClose={() => setIsClassroomOpen(false)}
        classData={activeClassForVideo}
      />
    </div>
  );
};

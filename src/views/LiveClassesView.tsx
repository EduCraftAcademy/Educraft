import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { classesApi } from '../api/client';
import { ScheduledClass, ClassSessionRecord } from '../types';
import { ClassroomModal } from '../components/ClassroomModal';
import {
  Video,
  Calendar,
  Lock,
  Play,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';

interface LiveClassesViewProps {
  onNavigate: (view: string) => void;
}

export const LiveClassesView: React.FC<LiveClassesViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [sessions, setSessions] = useState<ClassSessionRecord[]>([]);
  const [allowedRecordings, setAllowedRecordings] = useState<boolean>(true);
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);
  const [autoAssignSubject, setAutoAssignSubject] = useState<string>('Mathématiques');
  const [assigning, setAssigning] = useState<boolean>(false);
  const [assignResult, setAssignResult] = useState<any>(null);

  useEffect(() => {
    loadClasses();
  }, [user]);

  const loadClasses = async () => {
    classesApi.getTimetable().then(res => {
      if (res.success) setClasses(res.classes);
    });

    classesApi.getSessions().then(res => {
      if (res.success) {
        setSessions(res.sessions);
        setAllowedRecordings(res.allowedRecordings);
      }
    });
  };

  const planId = user?.studentProfile?.subscriptionPlanId || 'free';
  const hasLiveAccess = planId === 'plus' || planId === 'premium' || planId === 'vip' || user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'owner';

  const handleAutoAssign = async () => {
    setAssigning(true);
    setAssignResult(null);
    try {
      const res = await classesApi.autoAssign(undefined, autoAssignSubject);
      setAssignResult(res);
      loadClasses();
    } catch (e: any) {
      setAssignResult({ success: false, reason: e.message });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-blue-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-red-500/20 text-red-300">
              Classes Virtuelles en Direct
            </span>
            <span className="text-xs text-slate-300">
              Forfait : <strong className="text-cyan-300 uppercase">{planId}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black">Cours en Direct avec Enseignant</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Salles de classe interactives chiffrées avec audio/vidéo, tableau blanc collaboratif, partage d'écran et levée de main.
          </p>
        </div>

        {/* Live Entitlement Banner */}
        {!hasLiveAccess && (
          <div className="p-4 bg-amber-500 text-slate-950 rounded-2xl max-w-sm space-y-2 shrink-0">
            <div className="font-bold text-xs flex items-center gap-1.5">
              <Lock className="w-4 h-4" /> Forfait Basic ou Free actif
            </div>
            <p className="text-[11px] leading-snug">
              Les classes en direct et les replays enregistrés sont inclus à partir du forfait <strong>PLUS</strong> (dès 249 MAD/mois).
            </p>
            <button
              onClick={() => onNavigate('subscriptions')}
              className="w-full py-1.5 bg-slate-950 text-white rounded-lg text-xs font-bold hover:bg-black transition"
            >
              Passer au forfait PLUS →
            </button>
          </div>
        )}
      </div>

      {/* Auto-Assignment Engine Trigger */}
      {hasLiveAccess && user?.role === 'student' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Moteur d'Affectation Automatique de Classe
            </h3>
            <p className="text-xs text-slate-500">
              Notre algorithme vous assigne à un groupe compatible avec votre niveau ({user.studentProfile?.grade}), programme ({user.studentProfile?.curriculum}) et respectant les limites de taille (VIP: max 4 élèves).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={autoAssignSubject}
              onChange={e => setAutoAssignSubject(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
            >
              <option value="Mathématiques">Mathématiques</option>
              <option value="Physique-Chimie">Physique-Chimie</option>
              <option value="SVT">SVT</option>
              <option value="Français">Français</option>
            </select>
            <button
              onClick={handleAutoAssign}
              disabled={assigning}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {assigning ? 'Affectation...' : 'Rejoindre un Groupe'}
            </button>
          </div>
        </div>
      )}

      {assignResult && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          assignResult.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'
        }`}>
          {assignResult.success ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />}
          {assignResult.reason}
        </div>
      )}

      {/* Scheduled Classes Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Classes Programmées
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map(cls => (
            <div
              key={cls.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition p-6 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    {cls.subject}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {cls.startTime} - {cls.endTime}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{cls.title}</h3>
                <p className="text-xs text-slate-600">
                  Enseignant : <strong>{cls.teacherName}</strong>
                </p>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1">
                  <div>Niveau : {cls.grade}</div>
                  <div>Capacité du groupe : {cls.enrolledStudentIds.length} / {cls.maxCapacity} inscrits</div>
                </div>
              </div>

              <div className="pt-2">
                {hasLiveAccess ? (
                  <button
                    onClick={() => {
                      setSelectedClass(cls);
                      setIsClassModalOpen(true);
                    }}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Video className="w-4 h-4" /> Entrer dans la Salle de Cours
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate('subscriptions')}
                    className="w-full py-2.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4" /> Réservé aux forfaits payants
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recorded Lessons Archive */}
      <div className="space-y-4 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Play className="w-5 h-5 text-indigo-600" />
              Bibliothèque des Séances Enregistrées (Replays)
            </h2>
            <p className="text-xs text-slate-500">
              Révisez vos cours passés avec les explications complètes du professeur.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {allowedRecordings ? 'Accès Débloqué' : 'Accès Verrouillé'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sessions.map(ses => (
            <div
              key={ses.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Date : {ses.date}</span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5" /> {ses.durationMinutes} min
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{ses.topic}</h4>
                <p className="text-xs text-slate-600 line-clamp-2">{ses.notes}</p>
              </div>

              <div className="pt-2">
                {allowedRecordings && ses.recordingUrl ? (
                  <button
                    onClick={() => alert(`Lancement de la rediffusion vidéo : ${ses.topic}`)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" /> Visionner le Replay
                  </button>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-500" /> Replay inclus dans Plus, Premium & VIP
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Classroom Modal */}
      <ClassroomModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        classData={selectedClass}
      />
    </div>
  );
};

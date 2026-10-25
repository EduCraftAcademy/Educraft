import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  GraduationCap,
  Users,
  Video,
  FileCheck2,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Award,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: string) => void;
  onOpenPlans: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenPlans }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 text-white py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            L'Excellence Scolaire Révolutionnée par l'IA & de Vrais Professeurs
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            L'Éducation Nouvelle Génération pour le{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-cyan-300 to-teal-300">
              Primaire, Collège & Lycée
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            EduCraft AI Studio combine des <strong>ressources pédagogiques générées par l'IA</strong> (leçons, quiz, fiches de révision, exports PDF & PowerPoint) avec des <strong>classes en direct animées par des enseignants salariés qualifiés</strong>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => onNavigate('ai-studio')}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Générer un Cours avec l'IA
            </button>

            <button
              onClick={onOpenPlans}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              Découvrir les Forfaits (dès 0 MAD) <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-slate-800/80">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-2xl font-black text-cyan-400">100%</div>
              <div className="text-xs text-slate-400 mt-1">Conforme aux Programmes Officiels</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-2xl font-black text-blue-400">4 à 20</div>
              <div className="text-xs text-slate-400 mt-1">Élèves max par classe (VIP: 4)</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-2xl font-black text-teal-400">3 Formats</div>
              <div className="text-xs text-slate-400 mt-1">Exports PDF, Word & PowerPoint</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-2xl font-black text-purple-400">Salariés</div>
              <div className="text-xs text-slate-400 mt-1">Enseignants recrutés et mensualisés</div>
            </div>
          </div>
        </div>
      </section>

      {/* School Cycles Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Un Accompagnement Complet
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Trois Cycles d'Enseignement Adaptés
          </h2>
          <p className="text-sm text-slate-600">
            Chaque niveau bénéficie d'une pédagogie ciblée, d'outils interactifs et d'un suivi sur mesure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Primaire */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
              🌱
            </div>
            <h3 className="text-lg font-bold text-slate-900">École Primaire (1ère à 6ème AP)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Consolidation des fondamentaux en calcul, lecture, écriture et éveil scientifique. Interface intuitive conçue pour les jeunes apprenants.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Mathématiques & Arithmétique
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Français & Expression Écrite
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Langue Arabe & Éveil
              </li>
            </ul>
          </div>

          {/* Collège */}
          <div className="p-6 rounded-2xl border border-blue-200 bg-blue-50/40 shadow-xs hover:shadow-md transition space-y-4 relative">
            <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
              Très Demandé
            </span>
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">
              📐
            </div>
            <h3 className="text-lg font-bold text-slate-900">Collège (1AC, 2AC, 3AC / Brevet)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transition vers les sciences spécialisées, démonstrations géométriques et préparation intensive à l'examen régional du Brevet (3AC).
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600" /> Mathématiques BIOF / National
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600" /> Physique-Chimie & Mécanique
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600" /> Sciences de la Vie et de la Terre (SVT)
              </li>
            </ul>
          </div>

          {/* Lycée */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl">
              🎓
            </div>
            <h3 className="text-lg font-bold text-slate-900">Lycée (Tronc Commun, 1ère & 2ème Bac)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Excellence académique pour les filières Sciences Math, PC, SVT et Économie. Entraînement aux épreuves du Baccalauréat National et concours.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-purple-600" /> Analyse, Algèbre & Nombres Complexes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-purple-600" /> Électromagnétisme & Chimie Organique
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-purple-600" /> Classes VIP limitées à 4 élèves
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* The 4 Pillars of EduCraft */}
      <section className="bg-slate-50 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Pourquoi EduCraft AI Studio est Unique
            </h2>
            <p className="text-sm text-slate-600">
              Une architecture solide et transparente construite pour la réussite de chaque élève.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
              <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 w-fit">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Générateur Pédagogique IA</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Leçons complètes avec diapositives, glossaire, exercices pas-à-pas et quiz autocorrigé, générés selon le niveau exact.
              </p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
              <div className="p-2.5 rounded-lg bg-teal-100 text-teal-700 w-fit">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Professeurs Salariés Dédiés</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pas une marketplace libre : EduCraft rémunère ses professeurs par salaire mensuel fixe pour garantir engagement et rigueur.
              </p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
              <div className="p-2.5 rounded-lg bg-red-100 text-red-700 w-fit">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Classes Virtuelles & Replays</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Audio/vidéo en direct, tableau blanc interactif, levée de main et bibliothèque d'enregistrements (Plus, Premium, VIP).
              </p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
              <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700 w-fit">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Visibilité Totale pour les Parents</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Suivi multi-enfants, relevé de notes sur 20, assiduité aux cours, devoirs rendus et historique des paiements en MAD.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-linear-to-r from-blue-900 to-indigo-900 text-white shadow-xl space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black">
            Prêt à donner à vos enfants les meilleurs outils de réussite ?
          </h2>
          <p className="text-sm text-slate-200 max-w-xl mx-auto">
            Accédez immédiatement au Studio IA avec 3 leçons gratuites par mois ou souscrivez à un forfait avec cours en direct.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('ai-studio')}
              className="px-6 py-3 bg-white text-blue-900 hover:bg-slate-100 font-bold text-xs rounded-xl transition shadow-md"
            >
              Tester le Studio IA
            </button>
            <button
              onClick={onOpenPlans}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-md"
            >
              Voir les Forfaits & Tarifs
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

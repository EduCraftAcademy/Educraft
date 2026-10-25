import React, { useState, useRef, useEffect } from 'react';
import { ScheduledClass } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Hand,
  Monitor,
  PenTool,
  MessageSquare,
  Users,
  Send,
  Trash2,
  CheckCircle,
} from 'lucide-react';

interface ClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ScheduledClass | null;
}

interface ChatMessage {
  id: string;
  sender: string;
  isTeacher: boolean;
  text: string;
  time: string;
}

export const ClassroomModal: React.FC<ClassroomModalProps> = ({ isOpen, onClose, classData }) => {
  const { user } = useAuth();
  const [micOn, setMicOn] = useState<boolean>(true);
  const [camOn, setCamOn] = useState<boolean>(true);
  const [handRaised, setHandRaised] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'video' | 'whiteboard'>('video');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: classData?.teacherName || 'Prof. Enseignant',
      isTeacher: true,
      text: 'Bienvenue dans la classe virtuelle EduCraft ! Prenez vos cahiers, nous commençons.',
      time: '18:00',
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [whiteboardColor, setWhiteboardColor] = useState<string>('#0D3B66');
  const [brushSize, setBrushSize] = useState<number>(3);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen || activeView !== 'whiteboard') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = 480;

    // Clear background to clean white grid
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle math grid
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }, [isOpen, activeView]);

  if (!isOpen || !classData) return null;

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'owner';

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: user?.name || 'Moi',
      isTeacher: Boolean(isTeacher),
      text: inputMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, newMsg]);
    setInputMsg('');
  };

  // Whiteboard drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = whiteboardColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 md:p-6">
      <div className="relative w-full max-w-6xl h-[92vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden text-white">
        {/* Classroom Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
            <div>
              <h2 className="font-bold text-sm md:text-base text-white line-clamp-1">{classData.title}</h2>
              <p className="text-xs text-slate-400">
                Professeur : <strong>{classData.teacherName}</strong> • {classData.subject} • Salle : {classData.videoRoomId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
              <CheckCircle className="w-3.5 h-3.5" /> Chiffré de bout en bout
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition"
            >
              Quitter la classe
            </button>
          </div>
        </div>

        {/* Main Split Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Video Grid or Whiteboard */}
          <div className="flex-1 flex flex-col p-4 bg-slate-900 overflow-y-auto">
            {/* View Switcher Bar */}
            <div className="flex items-center justify-between mb-3 bg-slate-800/80 p-2 rounded-xl">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveView('video')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeView === 'video' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <VideoIcon className="w-4 h-4" /> Caméras Vidéo
                </button>
                <button
                  onClick={() => setActiveView('whiteboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeView === 'whiteboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <PenTool className="w-4 h-4" /> Tableau Blanc Interactif
                </button>
              </div>

              {activeView === 'whiteboard' && (
                <div className="flex items-center gap-2">
                  {/* Color palette */}
                  {['#0D3B66', '#E63946', '#2A9D8F', '#E76F51', '#000000'].map(c => (
                    <button
                      key={c}
                      onClick={() => setWhiteboardColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition ${
                        whiteboardColor === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <button
                    onClick={clearWhiteboard}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded transition"
                    title="Effacer le tableau"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* VIDEO VIEW */}
            {activeView === 'video' && (
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center justify-center">
                {/* Teacher Video Box */}
                <div className="relative aspect-video bg-slate-950 rounded-2xl border-2 border-blue-500 overflow-hidden flex flex-col items-center justify-center shadow-lg group">
                  <div className="w-20 h-20 rounded-full bg-linear-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-3xl font-bold text-white shadow-inner">
                    {classData.teacherName.charAt(0)}
                  </div>
                  <div className="absolute top-3 left-3 bg-blue-600 text-[11px] font-bold px-2.5 py-1 rounded-md text-white">
                    HÔTE / ENSEIGNANT
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-xs font-semibold px-2.5 py-1 rounded-md text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {classData.teacherName}
                  </div>
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs">
                    <div className="p-1.5 rounded-full bg-emerald-500 text-white">
                      <Mic className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Current User Video Box */}
                <div className="relative aspect-video bg-slate-950 rounded-2xl border border-slate-700 overflow-hidden flex flex-col items-center justify-center shadow-lg">
                  {camOn ? (
                    <div className="w-16 h-16 rounded-full bg-linear-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-2xl font-bold text-white">
                      {user?.name?.charAt(0) || 'E'}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-xs flex flex-col items-center gap-1">
                      <VideoOff className="w-8 h-8" />
                      Caméra coupée
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-xs font-semibold px-2.5 py-1 rounded-md text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {user?.name || 'Moi'} (Vous)
                  </div>

                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs">
                    <div className={`p-1.5 rounded-full ${micOn ? 'bg-slate-700 text-white' : 'bg-red-500 text-white'}`}>
                      {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {handRaised && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-md text-xs flex items-center gap-1 animate-bounce">
                      <Hand className="w-3.5 h-3.5" /> Main levée
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* WHITEBOARD VIEW */}
            {activeView === 'whiteboard' && (
              <div className="flex-1 w-full bg-white rounded-2xl border border-slate-700 overflow-hidden flex items-center justify-center relative cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-full"
                />
              </div>
            )}
          </div>

          {/* Right: Live Chat & Attendees Panel */}
          <div className="w-full md:w-80 bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col">
            {/* Attendees count */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-bold">
                <Users className="w-4 h-4 text-blue-400" />
                Participants ({classData.enrolledStudentIds.length + 1})
              </span>
              <span className="text-[11px] text-emerald-400">En direct</span>
            </div>

            {/* Chat Messages List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.map(m => (
                <div key={m.id} className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-bold ${
                        m.isTeacher ? 'text-blue-400' : 'text-emerald-400'
                      }`}
                    >
                      {m.sender} {m.isTeacher && '★'}
                    </span>
                    <span className="text-[10px] text-slate-500">{m.time}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 leading-relaxed">
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Poser une question..."
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-3">
          <button
            onClick={() => setMicOn(!micOn)}
            className={`p-3 rounded-full transition ${
              micOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-600 text-white'
            }`}
            title={micOn ? 'Couper le micro' : 'Activer le micro'}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setCamOn(!camOn)}
            className={`p-3 rounded-full transition ${
              camOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-600 text-white'
            }`}
            title={camOn ? 'Couper la caméra' : 'Activer la caméra'}
          >
            {camOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setHandRaised(!handRaised)}
            className={`p-3 rounded-full transition ${
              handRaised ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title="Lever la main"
          >
            <Hand className="w-5 h-5" />
          </button>

          <button
            onClick={() => alert('Le partage d\'écran est actif avec le tableau de bord de cours.')}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition"
            title="Partager l'écran"
          >
            <Monitor className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

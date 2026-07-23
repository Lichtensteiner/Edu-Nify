import React, { useState } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  Star, 
  HelpCircle, 
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Sliders
} from 'lucide-react';
import { Survey } from '../../types/surveyElection';
import confetti from 'canvas-confetti';

interface SurveyAnswerModalProps {
  survey: Survey | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (survey: Survey, answers: Record<string, any>) => Promise<void>;
  currentUser: any;
}

export const SurveyAnswerModal: React.FC<SurveyAnswerModalProps> = ({
  survey,
  isOpen,
  onClose,
  onSubmit,
  currentUser
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !survey) return null;

  const handleSetAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleToggleMultipleChoice = (questionId: string, optionId: string) => {
    const current = (answers[questionId] as string[]) || [];
    if (current.includes(optionId)) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: current.filter(id => id !== optionId)
      }));
    } else {
      setAnswers(prev => ({
        ...prev,
        [questionId]: [...current, optionId]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(survey, answers);
      setSubmitted(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        setSubmitted(false);
        setAnswers({});
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black truncate max-w-md">
                {survey.title}
              </h2>
              <p className="text-xs text-indigo-100">
                {survey.questions?.length || 0} question(s) • {survey.settings?.isAnonymous ? 'Vote Anonyme' : 'Vote Nominatif'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {submitted ? (
          <div className="p-12 text-center space-y-4 my-auto">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200 dark:shadow-none animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              Merci pour votre participation !
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Votre réponse a été enregistrée avec succès.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {survey.description && (
              <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900 text-xs font-medium text-indigo-900 dark:text-indigo-200">
                {survey.description}
              </div>
            )}

            <div className="space-y-6">
              {survey.questions?.map((q, idx) => (
                <div key={q.id} className="p-5 bg-gray-50 dark:bg-gray-900/60 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-4">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full mt-0.5">
                      Q{idx + 1}
                    </span>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {q.title} {q.required && <span className="text-red-500">*</span>}
                    </p>
                  </div>

                  {/* Single Choice */}
                  {q.type === 'single' && (
                    <div className="space-y-2">
                      {q.options?.map(opt => (
                        <label key={opt.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-indigo-500 transition-colors">
                          <input 
                            type="radio" 
                            name={`q_${q.id}`} 
                            value={opt.id}
                            checked={answers[q.id] === opt.id}
                            onChange={() => handleSetAnswer(q.id, opt.id)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Multiple Choice */}
                  {q.type === 'multiple' && (
                    <div className="space-y-2">
                      {q.options?.map(opt => {
                        const isChecked = ((answers[q.id] as string[]) || []).includes(opt.id);
                        return (
                          <label key={opt.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-indigo-500 transition-colors">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => handleToggleMultipleChoice(q.id, opt.id)}
                              className="text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Yes / No */}
                  {q.type === 'yesno' && (
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleSetAnswer(q.id, 'Oui')}
                        className={`flex-1 py-3 px-4 rounded-2xl border font-black text-xs flex items-center justify-center gap-2 transition-all ${
                          answers[q.id] === 'Oui'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <ThumbsUp size={16} /> Oui
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetAnswer(q.id, 'Non')}
                        className={`flex-1 py-3 px-4 rounded-2xl border font-black text-xs flex items-center justify-center gap-2 transition-all ${
                          answers[q.id] === 'Non'
                            ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-200'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <ThumbsDown size={16} /> Non
                      </button>
                    </div>
                  )}

                  {/* Free Text */}
                  {q.type === 'text' && (
                    <textarea 
                      rows={3}
                      placeholder="Tapez votre réponse ici..." 
                      value={answers[q.id] || ''}
                      onChange={(e) => handleSetAnswer(q.id, e.target.value)}
                      className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                  )}

                  {/* Star Rating (5) */}
                  {q.type === 'rating5' && (
                    <div className="flex items-center justify-center gap-3 py-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleSetAnswer(q.id, star)}
                          className={`p-2 rounded-2xl transition-transform hover:scale-125 ${
                            (answers[q.id] || 0) >= star ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'
                          }`}
                        >
                          <Star size={32} fill={(answers[q.id] || 0) >= star ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 10 Point Rating */}
                  {q.type === 'rating10' && (
                    <div className="flex items-center justify-between gap-1 py-2 overflow-x-auto">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => handleSetAnswer(q.id, n)}
                          className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center transition-all ${
                            answers[q.id] === n
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Dropdown */}
                  {q.type === 'dropdown' && (
                    <select
                      value={answers[q.id] || ''}
                      onChange={(e) => handleSetAnswer(q.id, e.target.value)}
                      className="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Choisissez une option --</option>
                      {q.options?.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  )}

                  {/* Slider */}
                  {q.type === 'slider' && (
                    <div className="space-y-2 py-2">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                        <span>Pas du tout satisfait</span>
                        <span className="text-indigo-600 font-black text-sm">{answers[q.id] ?? 50}%</span>
                        <span>Extrêmement satisfait</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={answers[q.id] ?? 50}
                        onChange={(e) => handleSetAnswer(q.id, Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 font-bold text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-xs transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
              >
                <Send size={16} />
                {submitting ? 'Envoi...' : 'Soumettre mes réponses'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

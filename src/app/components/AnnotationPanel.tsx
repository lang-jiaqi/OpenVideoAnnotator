import { useState } from 'react';
import { Download, Pencil, Trash2, Check, X } from 'lucide-react';

export interface Annotation {
  id: string;
  timestamp: number;
  type: 'VLM' | 'LLM';
  question: string;
  requirements: string;
  feedbackDuration: number;
}

interface AnnotationPanelProps {
  isAnnotating: boolean;
  onStartAnnotation: () => void;
  onDoneAnnotation: (type: 'VLM' | 'LLM', question: string, requirements: string, feedbackDuration: number, manualTimestamp?: number) => void;
  annotations: Annotation[];
  onGenerateJSON: () => void;
  onDeleteAnnotation: (id: string) => void;
  onUpdateAnnotation: (id: string, updatedAnnotation: Omit<Annotation, 'id'>) => void;
  currentTime?: number;
}

export function AnnotationPanel({
  isAnnotating,
  onStartAnnotation,
  onDoneAnnotation,
  annotations,
  onGenerateJSON,
  onDeleteAnnotation,
  onUpdateAnnotation,
  currentTime,
}: AnnotationPanelProps) {
  const [annotationType, setAnnotationType] = useState<'VLM' | 'LLM'>('VLM');
  const [annotationQuestion, setAnnotationQuestion] = useState('');
  const [annotationRequirements, setAnnotationRequirements] = useState('');
  const [feedbackDuration, setFeedbackDuration] = useState(6);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    type: 'VLM' | 'LLM';
    question: string;
    requirements: string;
    feedbackDuration: number;
  } | null>(null);

  const handleDone = () => {
    if (annotationQuestion.trim()) {
      onDoneAnnotation(annotationType, annotationQuestion, annotationRequirements, feedbackDuration, currentTime);
      setAnnotationQuestion('');
      setAnnotationRequirements('');
      setFeedbackDuration(6);
    }
  };

  const handleEdit = (annotation: Annotation) => {
    setEditingId(annotation.id);
    setEditForm({
      type: annotation.type,
      question: annotation.question,
      requirements: annotation.requirements,
      feedbackDuration: annotation.feedbackDuration,
    });
  };

  const handleSaveEdit = (annotation: Annotation) => {
    if (editForm && editForm.question.trim()) {
      onUpdateAnnotation(annotation.id, {
        timestamp: annotation.timestamp,
        type: editForm.type,
        question: editForm.question,
        requirements: editForm.requirements,
        feedbackDuration: editForm.feedbackDuration,
      });
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl mb-6">Video Annotations</h2>

      {/* Annotation Type Selection */}
      <div className="mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setAnnotationType('VLM')}
            disabled={isAnnotating}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              annotationType === 'VLM'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${isAnnotating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            VLM
          </button>
          <button
            onClick={() => setAnnotationType('LLM')}
            disabled={isAnnotating}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              annotationType === 'LLM'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${isAnnotating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            LLM
          </button>
        </div>
      </div>

      {/* Annotation Input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-700 mb-2">Question & Requirements</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Question</label>
            <textarea
              value={annotationQuestion}
              onChange={(e) => setAnnotationQuestion(e.target.value)}
              disabled={!isAnnotating}
              placeholder={isAnnotating ? "Enter your question..." : "Click START to begin"}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Answer Requirements</label>
            <textarea
              value={annotationRequirements}
              onChange={(e) => setAnnotationRequirements(e.target.value)}
              disabled={!isAnnotating}
              placeholder={isAnnotating ? "Enter answer requirements or preferences..." : "Click START to begin"}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Feedback Duration Input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-700 mb-2">Feedback Duration (seconds)</label>
        <input
          type="number"
          min="0"
          step="0.5"
          value={feedbackDuration}
          onChange={(e) => setFeedbackDuration(Number(e.target.value))}
          disabled={!isAnnotating}
          placeholder="6"
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        {!isAnnotating ? (
          <button
            onClick={onStartAnnotation}
            className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            START
          </button>
        ) : (
          <button
            onClick={handleDone}
            disabled={!annotationQuestion.trim()}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            DONE
          </button>
        )}
      </div>

      {/* Annotations List */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        <h3 className="text-sm text-gray-600 mb-2">
          Annotations ({annotations.length})
        </h3>
        {annotations.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No annotations yet
          </p>
        ) : (
          annotations.map((annotation) => (
            <div
              key={annotation.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              {editingId === annotation.id && editForm ? (
                // Edit Mode
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditForm({ ...editForm, type: 'VLM' })}
                      className={`flex-1 py-1 px-3 text-xs rounded-lg transition-colors ${
                        editForm.type === 'VLM'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      VLM
                    </button>
                    <button
                      onClick={() => setEditForm({ ...editForm, type: 'LLM' })}
                      className={`flex-1 py-1 px-3 text-xs rounded-lg transition-colors ${
                        editForm.type === 'LLM'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      LLM
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Question</label>
                    <textarea
                      value={editForm.question}
                      onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                      className="w-full h-20 p-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Requirements</label>
                    <textarea
                      value={editForm.requirements}
                      onChange={(e) => setEditForm({ ...editForm, requirements: e.target.value })}
                      className="w-full h-16 p-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Feedback Duration (s)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={editForm.feedbackDuration}
                      onChange={(e) => setEditForm({ ...editForm, feedbackDuration: Number(e.target.value) })}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 py-1 px-3 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(annotation)}
                      disabled={!editForm.question.trim()}
                      className="flex items-center gap-1 py-1 px-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        annotation.type === 'VLM'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {annotation.type}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatTime(annotation.timestamp)} | {annotation.feedbackDuration}s
                    </span>
                  </div>
                  <div className="mb-1">
                    <span className="text-xs text-gray-500">Q:</span>
                    <p className="text-sm text-gray-700">{annotation.question}</p>
                  </div>
                  {annotation.requirements && (
                    <div className="mb-2">
                      <span className="text-xs text-gray-500">Requirements:</span>
                      <p className="text-sm text-gray-600">{annotation.requirements}</p>
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEdit(annotation)}
                      className="flex items-center gap-1 py-1 px-2 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteAnnotation(annotation.id)}
                      className="flex items-center gap-1 py-1 px-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Generate JSON Button */}
      <button
        onClick={onGenerateJSON}
        disabled={annotations.length === 0}
        className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Download className="w-5 h-5" />
        GENERATE JSON
      </button>
    </div>
  );
}
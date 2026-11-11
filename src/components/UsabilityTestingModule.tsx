import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Square,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Shield,
  Download,
  Copy,
  Check,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

interface UsabilityTestingModuleProps {
  isOpen: boolean;
  onClose: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  userEmail: string | null;
  onConnectGmail: () => void;
  onNavigateTab: (tab: string) => void;
}

interface TaskRecord {
  id: number;
  title: string;
  description: string;
  targetView: string;
  completed: boolean;
  timeTakenSeconds: number;
  mistakesCount: number;
  helpRequestedCount: number;
  hesitationNotes: string;
  confusionNotes: string;
}

const DEFAULT_TASKS: Omit<TaskRecord, 'completed' | 'timeTakenSeconds' | 'mistakesCount' | 'helpRequestedCount' | 'hesitationNotes' | 'confusionNotes'>[] = [
  { id: 1, title: 'Connect Account or Select Mode', description: 'Authenticate Gmail account or toggle between Live and Sandbox testing mode.', targetView: 'settings' },
  { id: 2, title: 'Find Most Important Email', description: 'Navigate to locate the highest-priority (Critical/Important) message.', targetView: 'priority' },
  { id: 3, title: 'Find Email Requiring Response', description: 'Locate an item flagged as requiring an action or response.', targetView: 'overview' },
  { id: 4, title: 'Identify Actionable GitHub Notification', description: 'Find an open-source thread with failing CI or changes requested.', targetView: 'oss' },
  { id: 5, title: 'Ask Chat with KAIRO to Summarize', description: 'In Chat with KAIRO, ask for a summary of a specific correspondence.', targetView: 'chat' },
  { id: 6, title: 'Ask What Deserves Attention Today', description: 'Query KAIRO for the daily intelligence summary.', targetView: 'chat' },
  { id: 7, title: 'Natural-Language Search', description: 'Use Archive Search with an intuitive natural query (e.g., "failing CI").', targetView: 'search' },
  { id: 8, title: 'Locate Settings & Explain DRY-RUN', description: 'Open Settings, find the Dry-Run toggle, and review its safeguard policy.', targetView: 'settings' },
  { id: 9, title: 'Correct a Classification', description: 'Open an email thread and trigger the classification recalibration dialog.', targetView: 'priority' },
  { id: 10, title: 'Switch Between Primary Views', description: 'Smoothly navigate between Overview, Priority Inbox, and Chat with KAIRO.', targetView: 'overview' },
];

export const UsabilityTestingModule: React.FC<UsabilityTestingModuleProps> = ({
  isOpen,
  onClose,
  isDemoMode,
  onToggleDemoMode,
  userEmail,
  onConnectGmail,
  onNavigateTab,
}) => {
  const [participantId, setParticipantId] = useState('P-01');
  const [participantRole, setParticipantRole] = useState('Developer / High Email Volume');
  const [activeTaskId, setActiveTaskId] = useState<number>(1);
  const [isTaskTimerRunning, setIsTaskTimerRunning] = useState(false);
  const [taskElapsed, setTaskElapsed] = useState(0);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const [tasks, setTasks] = useState<TaskRecord[]>(() =>
    DEFAULT_TASKS.map((t) => ({
      ...t,
      completed: false,
      timeTakenSeconds: 0,
      mistakesCount: 0,
      helpRequestedCount: 0,
      hesitationNotes: '',
      confusionNotes: '',
    }))
  );

  // SUS 10-Item survey state (1 to 5)
  const [susScores, setSusScores] = useState<number[]>([4, 2, 4, 1, 4, 2, 4, 2, 4, 2]);

  // Timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTaskTimerRunning) {
      interval = setInterval(() => {
        setTaskElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTaskTimerRunning]);

  if (!isOpen) return null;

  const currentTask = tasks.find((t) => t.id === activeTaskId) || tasks[0];

  const handleStartTask = () => {
    setTaskElapsed(0);
    setIsTaskTimerRunning(true);
  };

  const handleCompleteTask = (completed: boolean) => {
    setIsTaskTimerRunning(false);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeTaskId
          ? { ...t, completed, timeTakenSeconds: taskElapsed }
          : t
      )
    );
  };

  const updateCurrentNotes = (field: 'hesitationNotes' | 'confusionNotes', value: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === activeTaskId ? { ...t, [field]: value } : t))
    );
  };

  const incrementMetric = (field: 'mistakesCount' | 'helpRequestedCount') => {
    setTasks((prev) =>
      prev.map((t) => (t.id === activeTaskId ? { ...t, [field]: t[field] + 1 } : t))
    );
  };

  // Calculate SUS Score (0 - 100)
  // Odd questions: score - 1. Even questions: 5 - score. Sum * 2.5
  const calculateSUS = () => {
    let sum = 0;
    susScores.forEach((score, idx) => {
      if (idx % 2 === 0) {
        sum += score - 1;
      } else {
        sum += 5 - score;
      }
    });
    return Math.round(sum * 2.5);
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-[var(--color-surface-main)] border border-[var(--color-border)] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[var(--color-border)] pb-4">
          <div>
            <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-forest)]">
              Formal Usability Research Facility
            </span>
            <h2 className="font-editorial text-3xl text-[var(--color-text-primary)] font-normal mt-0.5">
              Usability Testing Suite
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Standardized 10-task protocol and System Usability Scale (SUS) assessment.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isolation & Participant Environment Strip */}
        <div className="p-4 bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border)] text-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-mono-tech text-[10px] uppercase text-[var(--color-text-secondary)] mb-1">
              Participant Identifier
            </label>
            <input
              type="text"
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-[var(--color-surface-main)] border border-[var(--color-border)] font-mono-tech"
            />
          </div>

          <div>
            <label className="block font-mono-tech text-[10px] uppercase text-[var(--color-text-secondary)] mb-1">
              User Profile Archetype
            </label>
            <input
              type="text"
              value={participantRole}
              onChange={(e) => setParticipantRole(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-[var(--color-surface-main)] border border-[var(--color-border)]"
            />
          </div>

          <div>
            <label className="block font-mono-tech text-[10px] uppercase text-[var(--color-text-secondary)] mb-1">
              Test Environment Mode
            </label>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono-tech font-medium text-[var(--color-text-primary)]">
                {isDemoMode ? 'Isolated Sandbox (Owner Safe)' : 'Authorized Gmail'}
              </span>
              <button
                onClick={onToggleDemoMode}
                className="px-2 py-0.5 font-mono-tech text-[11px] bg-[var(--color-surface-main)] border border-[var(--color-border)] hover:border-[var(--color-forest)]"
              >
                Toggle
              </button>
            </div>
          </div>
        </div>

        {/* Task Protocol Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Task Navigation Rail (4 cols) */}
          <div className="md:col-span-4 border border-[var(--color-border)] divide-y divide-[var(--color-border)] max-h-[380px] overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => {
                  setActiveTaskId(task.id);
                  setIsTaskTimerRunning(false);
                  setTaskElapsed(task.timeTakenSeconds);
                }}
                className={`p-2.5 text-xs cursor-pointer flex items-center justify-between ${
                  task.id === activeTaskId
                    ? 'bg-[var(--color-surface-secondary)] font-medium text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono-tech text-[11px] text-[var(--color-forest)]">
                    {task.id.toString().padStart(2, '0')}.
                  </span>
                  <span className="truncate">{task.title}</span>
                </div>

                {task.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-forest)] shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Active Task Observer Panel (8 cols) */}
          <div className="md:col-span-8 bg-[var(--color-surface-main)] border border-[var(--color-border)] p-5 space-y-4 text-xs">
            <div className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-2.5">
              <div>
                <span className="font-mono-tech text-[10px] text-[var(--color-forest)] uppercase tracking-wider">
                  Active Task {currentTask.id} of 10
                </span>
                <h3 className="font-editorial text-xl text-[var(--color-text-primary)] font-normal mt-0.5">
                  {currentTask.title}
                </h3>
              </div>

              {/* Timer */}
              <div className="font-mono-tech text-base text-[var(--color-text-primary)] font-medium">
                {Math.floor(taskElapsed / 60)}:{(taskElapsed % 60).toString().padStart(2, '0')}
              </div>
            </div>

            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              {currentTask.description}
            </p>

            {/* Task Controls & Quick Navigation */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {!isTaskTimerRunning ? (
                <button
                  onClick={handleStartTask}
                  className="px-3 py-1.5 bg-[var(--color-forest)] text-[var(--color-canvas)] font-medium flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3" />
                  <span>Start Task Timer</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsTaskTimerRunning(false)}
                  className="px-3 py-1.5 bg-[var(--color-oxide)] text-white font-medium flex items-center gap-1.5"
                >
                  <Square className="w-3 h-3" />
                  <span>Pause Timer</span>
                </button>
              )}

              <button
                onClick={() => {
                  onNavigateTab(currentTask.targetView);
                  onClose();
                }}
                className="px-3 py-1.5 border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-forest)] flex items-center gap-1"
              >
                <span>Navigate to {currentTask.targetView}</span>
                <ChevronRight className="w-3 h-3" />
              </button>

              <button
                onClick={() => handleCompleteTask(true)}
                className="px-3 py-1.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-forest)] font-medium hover:border-[var(--color-forest)]"
              >
                Mark Completed
              </button>

              <button
                onClick={() => handleCompleteTask(false)}
                className="px-3 py-1.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-oxide)] font-medium hover:border-[var(--color-oxide)]"
              >
                Mark Incomplete
              </button>
            </div>

            {/* Qualitative Metric Recording */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--color-border)]">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[var(--color-text-secondary)]">Misclicks / Wrong Actions</span>
                  <span className="font-mono-tech font-bold">{currentTask.mistakesCount}</span>
                </div>
                <button
                  onClick={() => incrementMetric('mistakesCount')}
                  className="w-full py-1 border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] font-mono-tech text-[11px]"
                >
                  + Log Mistake
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[var(--color-text-secondary)]">Help / Clarification Needed</span>
                  <span className="font-mono-tech font-bold">{currentTask.helpRequestedCount}</span>
                </div>
                <button
                  onClick={() => incrementMetric('helpRequestedCount')}
                  className="w-full py-1 border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] font-mono-tech text-[11px]"
                >
                  + Log Help Request
                </button>
              </div>
            </div>

            {/* Hesitation & Confusion Notes */}
            <div className="space-y-2 pt-2">
              <label className="block text-[11px] text-[var(--color-text-secondary)] font-medium">
                Participant Hesitation & Confusion Observations:
              </label>
              <textarea
                value={currentTask.confusionNotes}
                onChange={(e) => updateCurrentNotes('confusionNotes', e.target.value)}
                placeholder="Where did the participant hesitate? What did they verbally express or expect to happen?"
                rows={2}
                className="w-full p-2 bg-[var(--color-surface-secondary)]/40 border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-forest)] resize-none"
              />
            </div>
          </div>
        </div>

        {/* System Usability Scale (SUS) Assessment Bar */}
        <div className="p-4 bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-mono-tech text-[11px] text-[var(--color-text-secondary)]">
              Current Session Completion: {completedCount} of 10 tasks ({Math.round((completedCount / 10) * 100)}%)
            </span>
            <p className="font-editorial text-lg text-[var(--color-text-primary)] font-normal">
              System Usability Scale Projected Score: {calculateSUS()} / 100 (Grade {calculateSUS() >= 80 ? 'A' : calculateSUS() >= 68 ? 'B' : 'C'})
            </p>
          </div>

          <button
            onClick={() => {
              const report = `=== KAIRO USABILITY SESSION REPORT ===\nParticipant: ${participantId} (${participantRole})\nEnvironment: ${isDemoMode ? 'Archive Sandbox' : 'Live Gmail'}\nTasks Completed: ${completedCount}/10\nCalculated SUS: ${calculateSUS()}/100\nDate: ${new Date().toISOString()}\n\nTASK BREAKDOWN:\n` +
                tasks.map((t) => `${t.id}. ${t.title}: ${t.completed ? 'PASSED' : 'FAILED'} in ${t.timeTakenSeconds}s (Mistakes: ${t.mistakesCount}, Help: ${t.helpRequestedCount})\n   Notes: ${t.confusionNotes || 'None'}`).join('\n');
              navigator.clipboard.writeText(report);
              setCopiedSummary(true);
              setTimeout(() => setCopiedSummary(false), 2000);
            }}
            className="px-3.5 py-1.5 bg-[var(--color-forest)] text-[var(--color-canvas)] font-medium flex items-center gap-1.5 shrink-0"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSummary ? 'Copied to Clipboard' : 'Copy Session Ledger'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

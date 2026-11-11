import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  Search,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  FileEdit,
  Archive,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  ChatConversation,
  ChatMessage,
  ChatSuggestedAction,
  EmailMessage,
  UserPreferences,
} from '../types/index.ts';
import {
  loadChatConversations,
  saveChatConversations,
} from '../lib/storage.ts';

interface ChatWithKairoViewProps {
  emails: EmailMessage[];
  userEmail: string | null;
  preferences: UserPreferences;
  onOpenEmail: (email: EmailMessage) => void;
  onExecuteAction?: (action: ChatSuggestedAction) => Promise<void>;
}

const QUICK_PROMPTS = [
  { label: "What's important today?", query: "What important emails did I receive today that require my attention?" },
  { label: 'Check my OSS activity', query: 'Give me an update on my GitHub PRs, reviews, and failing CI.' },
  { label: 'Find emails awaiting my reply', query: 'Which conversations are awaiting a response from me?' },
  { label: 'Give me my daily briefing', query: 'Synthesize a high-priority executive briefing of my inbox.' },
  { label: 'Find upcoming deadlines', query: 'Are there any emails mentioning imminent deadlines or deliverables?' },
];

export const ChatWithKairoView: React.FC<ChatWithKairoViewProps> = ({
  emails,
  userEmail,
  preferences,
  onOpenEmail,
  onExecuteAction,
}) => {
  const [conversations, setConversations] = useState<ChatConversation[]>(loadChatConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeToolStatus, setActiveToolStatus] = useState<string | null>(null);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or select active conversation
  useEffect(() => {
    if (conversations.length === 0) {
      const initial: ChatConversation = {
        id: `conv_${Date.now()}`,
        title: 'Inbox Intelligence Inquiry',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      setConversations([initial]);
      setActiveConversationId(initial.id);
      saveChatConversations([initial]);
    } else if (!activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isLoading, activeToolStatus]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const handleCreateNewChat = () => {
    const newConv: ChatConversation = {
      id: `conv_${Date.now()}`,
      title: 'New Inquiry',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    const updated = [newConv, ...conversations];
    setConversations(updated);
    setActiveConversationId(newConv.id);
    saveChatConversations(updated);
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    saveChatConversations(updated);
    if (activeConversationId === id) {
      setActiveConversationId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleStartRename = (conv: ChatConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleSaveRename = (id: string) => {
    if (!editingTitle.trim()) return;
    const updated = conversations.map((c) =>
      c.id === id ? { ...c, title: editingTitle.trim(), updatedAt: new Date().toISOString() } : c
    );
    setConversations(updated);
    saveChatConversations(updated);
    setEditingConvId(null);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading || !activeConversationId) return;

    setInputMessage('');

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    // Update conversation with user turn
    const updatedWithUser = conversations.map((conv) => {
      if (conv.id === activeConversationId) {
        const newTitle =
          conv.messages.length === 0
            ? text.slice(0, 32) + (text.length > 32 ? '...' : '')
            : conv.title;
        return {
          ...conv,
          title: newTitle,
          updatedAt: new Date().toISOString(),
          messages: [...conv.messages, userMessage],
        };
      }
      return conv;
    });

    setConversations(updatedWithUser);
    saveChatConversations(updatedWithUser);

    setIsLoading(true);
    setActiveToolStatus('Analyzing correspondence archive...');

    try {
      const currentConv = updatedWithUser.find((c) => c.id === activeConversationId);
      const conversationTurns = currentConv
        ? currentConv.messages.map((m) => ({
            role: m.role,
            content: m.content,
          }))
        : [{ role: 'user', content: text }];

      // Call server Gemini endpoint
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationTurns,
          emails,
          userEmail,
          preferences,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API response code: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: data.reply || 'Here is the synthesized intelligence from your correspondence.',
        timestamp: new Date().toISOString(),
        toolCalls: data.toolCalls,
        referencedEmailIds: data.referencedEmailIds,
        suggestedActions: data.suggestedActions,
      };

      const updatedWithAssistant = updatedWithUser.map((conv) => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            updatedAt: new Date().toISOString(),
            messages: [...conv.messages, assistantMessage],
          };
        }
        return conv;
      });

      setConversations(updatedWithAssistant);
      saveChatConversations(updatedWithAssistant);
    } catch (err: any) {
      console.error('Failed to get chat response:', err);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'assistant',
        content: `I was unable to complete the inbox synthesis: ${err.message}. Please check your connection and retry.`,
        timestamp: new Date().toISOString(),
        toolCalls: [{ name: 'search_emails', status: 'failed', statusText: 'Connection failed' }],
      };

      const updatedWithError = updatedWithUser.map((conv) => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, errorMessage],
          };
        }
        return conv;
      });
      setConversations(updatedWithError);
      saveChatConversations(updatedWithError);
    } finally {
      setIsLoading(false);
      setActiveToolStatus(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Workspace Header */}
      <div className="border-b border-[var(--color-border)] pb-5 pt-2 mb-6">
        <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
          Intelligent Research Assistant
        </span>
        <h1 className="font-editorial text-4xl text-[var(--color-text-primary)] font-normal mt-0.5">
          Chat with KAIRO
        </h1>
        <p className="font-sans text-[var(--color-text-secondary)] text-sm mt-1 max-w-2xl">
          Conduct deep inquiries into your communications, trace pull request dialogues, and formulate contextual operations.
        </p>
      </div>

      {/* Two-Column Conversational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border border-[var(--color-border)] bg-[var(--color-surface-main)] min-h-[700px]">
        {/* Left Column: Inquiries List (4 cols) */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] flex flex-col h-[700px]">
          {/* Rail Header */}
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
              Inquiry Sessions
            </span>
            <button
              onClick={handleCreateNewChat}
              className="px-2.5 py-1 text-xs bg-[var(--color-forest)] text-[var(--color-canvas)] font-medium hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Inquiry</span>
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]/60">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isEditing = conv.id === editingConvId;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`p-3.5 cursor-pointer transition-colors group relative ${
                    isActive
                      ? 'bg-[var(--color-surface-secondary)]/80'
                      : 'hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-forest)]" />
                  )}

                  {isEditing ? (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(conv.id);
                          if (e.key === 'Escape') setEditingConvId(null);
                        }}
                        autoFocus
                        className="flex-1 px-2 py-0.5 text-xs bg-[var(--color-surface-main)] border border-[var(--color-forest)] text-[var(--color-text-primary)] focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveRename(conv.id)}
                        className="p-1 text-[var(--color-forest)] hover:opacity-80"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingConvId(null)}
                        className="p-1 text-[var(--color-text-secondary)] hover:opacity-80"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                          {conv.title}
                        </p>
                        <p className="font-mono-tech text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                          {conv.messages.length} exchanges ·{' '}
                          {new Date(conv.updatedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button
                          onClick={(e) => handleStartRename(conv, e)}
                          title="Rename Inquiry"
                          className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {conversations.length > 1 && (
                          <button
                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                            title="Delete Inquiry"
                            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-oxide)]"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Conversation Canvas (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[700px] bg-[var(--color-surface-main)]">
          {/* Conversation Messages */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
            {(!activeConversation || activeConversation.messages.length === 0) ? (
              <div className="py-12 max-w-xl mx-auto space-y-6 text-center">
                <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-forest)]">
                  Intelligence Co-Pilot Ready
                </span>
                <h2 className="font-editorial text-3xl text-[var(--color-text-primary)] font-normal">
                  How may KAIRO assist your inbox operations?
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Ask about high-priority messages, synthesize today&apos;s GitHub pull request activity, locate buried correspondence, or command draft responses.
                </p>

                {/* Suggested Starters */}
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt.query)}
                      className="p-3 bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border)] hover:border-[var(--color-forest)] text-xs text-[var(--color-text-primary)] text-left transition-colors"
                    >
                      <p className="font-medium">{prompt.label}</p>
                      <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-1">
                        {prompt.query}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeConversation.messages.map((message) => {
                const isAssistant = message.role === 'assistant';

                return (
                  <div
                    key={message.id}
                    className={`space-y-3 ${isAssistant ? '' : 'pl-4 border-l-2 border-[var(--color-forest)]'}`}
                  >
                    {/* Role Header */}
                    <div className="flex items-center gap-2 font-mono-tech text-[11px] text-[var(--color-text-secondary)]">
                      <span className={isAssistant ? 'font-semibold text-[var(--color-forest)]' : 'text-[var(--color-text-primary)]'}>
                        {isAssistant ? 'KAIRO' : 'YOU'}
                      </span>
                      <span>·</span>
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Tool Calls Indicators if assistant */}
                    {isAssistant && message.toolCalls && message.toolCalls.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-xs font-mono-tech">
                        {message.toolCalls.map((tc, idx) => (
                          <div
                            key={idx}
                            className="px-2.5 py-0.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-forest)]" />
                            <span>{tc.name}</span>
                            {tc.statusText && <span className="text-[var(--color-text-tertiary)]">({tc.statusText})</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Text Content */}
                    <div className="prose prose-sm max-w-none text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap font-sans">
                      {message.content}
                    </div>

                    {/* Inline Referenced Emails */}
                    {isAssistant && message.referencedEmailIds && message.referencedEmailIds.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
                          Referenced Communications
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {message.referencedEmailIds.map((id) => {
                            const refEmail = emails.find((e) => e.id === id);
                            if (!refEmail) return null;

                            return (
                              <div
                                key={id}
                                onClick={() => onOpenEmail(refEmail)}
                                className="p-3 bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] hover:border-[var(--color-forest)] cursor-pointer transition-colors text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between text-[11px] font-mono-tech">
                                  <span className="font-medium text-[var(--color-text-primary)] truncate max-w-[140px]">
                                    {refEmail.fromName}
                                  </span>
                                  <span className="text-[var(--color-forest)]">
                                    P{refEmail.classification?.priority ?? 1}
                                  </span>
                                </div>
                                <p className="font-medium text-[var(--color-text-primary)] truncate">
                                  {refEmail.subject}
                                </p>
                                <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-1">
                                  {refEmail.snippet}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Inline Suggested Actions */}
                    {isAssistant && message.suggestedActions && message.suggestedActions.length > 0 && (
                      <div className="pt-3 border-t border-[var(--color-border)]/60 space-y-2">
                        <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--color-brass)]">
                          Proposed Action
                        </span>
                        {message.suggestedActions.map((action) => (
                          <div
                            key={action.id}
                            className="p-3.5 bg-[var(--color-surface-secondary)] border border-[var(--color-brass)]/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-0.5">
                              <p className="font-medium text-[var(--color-text-primary)]">
                                {action.description}
                              </p>
                              <p className="font-mono-tech text-[11px] text-[var(--color-text-secondary)]">
                                Action Type: {action.actionType}
                              </p>
                            </div>

                            <button
                              onClick={() => onExecuteAction && onExecuteAction(action)}
                              className="px-3 py-1.5 bg-[var(--color-forest)] text-[var(--color-canvas)] text-xs font-medium shrink-0 hover:opacity-90 transition-opacity"
                            >
                              Approve & Execute
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* In-Flight Tool Status Indicator */}
            {isLoading && (
              <div className="space-y-2 py-2">
                <div className="flex items-center gap-2 font-mono-tech text-xs text-[var(--color-forest)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-forest)] animate-pulse" />
                  <span>{activeToolStatus || 'Reasoning with Gemini...'}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Composer */}
          <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-main)]">
            <div className="relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask KAIRO to analyze an email, search threads, or review PRs..."
                rows={2}
                disabled={isLoading}
                className="w-full p-3 pr-12 text-xs bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-forest)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="absolute right-3 bottom-4 p-1.5 bg-[var(--color-forest)] text-[var(--color-canvas)] hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono-tech text-[var(--color-text-secondary)] mt-2">
              <span>Return to submit · Shift+Return for line break</span>
              <span>Gemini 3.8 Flash Context Engine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

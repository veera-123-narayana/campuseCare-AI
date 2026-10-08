import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send,
  Square,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Database,
  ExternalLink,
  Building2,
  BellRing,
  Cpu,
  Radio,
  Zap,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
  Layers,
  Search,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { api } from '../services/api';
import {
  AssistantResponse,
  AssistantToolCall,
  AssistantSourceRecord,
  DataSourceType,
} from '../types';
import { SourceBadge } from '../components/ui/SourceBadge';
import { PriorityPill } from '../components/ui/PriorityPill';
import { Button } from '../components/ui/Button';

interface AssistantPageProps {
  onNavigate: (path: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  toolCalls?: AssistantToolCall[];
  sourceRecords?: AssistantSourceRecord[];
  suggestedActions?: string[];
  relevantRooms?: string[];
  source?: DataSourceType;
  degradedMode?: boolean;
  isStreaming?: boolean;
  error?: boolean;
}

const SUGGESTED_PROMPTS = [
  'Which classrooms need attention?',
  'What classes are running now?',
  'Which sensors are offline?',
  'Which rooms are wasting energy?',
  'Where is the AI lab?',
  'Show active alerts',
];

export const AssistantPage: React.FC<AssistantPageProps> = ({ onNavigate }) => {
  const { dataMode } = useCampus();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastQueryText, setLastQueryText] = useState<string>('');
  const [degradedMode, setDegradedMode] = useState<boolean>(false);
  const [forceErrorSimulation, setForceErrorSimulation] = useState<boolean>(false);

  // Active message whose sources are inspected in the right panel
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  // Set of message IDs whose "Data used" collapsible is open
  const [expandedDataUsed, setExpandedDataUsed] = useState<Record<string, boolean>>({});

  // Stream cancellation ref
  const cancelStreamRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, isQuerying]);

  // Find the message whose sources to display (selected message or latest assistant message)
  const inspectedMessage = useMemo(() => {
    if (activeMessageId) {
      const found = messages.find((m) => m.id === activeMessageId && m.sender === 'assistant');
      if (found) return found;
    }
    // Default to the latest assistant message
    const reversed = [...messages].reverse();
    return reversed.find((m) => m.sender === 'assistant');
  }, [messages, activeMessageId]);

  // Toggle "Data used" accordion
  const toggleDataUsed = (msgId: string) => {
    setExpandedDataUsed((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  // Stop streaming generation
  const handleStopStreaming = () => {
    cancelStreamRef.current = true;
    setIsStreaming(false);
    setIsQuerying(false);
    setMessages((prev) =>
      prev.map((msg) => (msg.isStreaming ? { ...msg, isStreaming: false } : msg))
    );
  };

  // Send message and simulate fast streaming effect
  const handleSend = async (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q || isQuerying || isStreaming) return;

    setLastQueryText(q);
    setInput('');
    cancelStreamRef.current = false;

    // Add user message
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toTimeString().split(' ')[0],
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsQuerying(true);

    // If forced error simulation is enabled for testing retry
    if (forceErrorSimulation) {
      setTimeout(() => {
        setIsQuerying(false);
        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to reach campus telemetry gateway. Physical communication link to Raspberry Pi cluster timed out.',
          timestamp: new Date().toTimeString().split(' ')[0],
          error: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      }, 500);
      return;
    }

    try {
      // Call mock askAssistant with simulated latency and tool-calls trace
      const res: AssistantResponse = await api.askAssistant(q, { degradedMode });

      if (cancelStreamRef.current) {
        setIsQuerying(false);
        return;
      }

      setIsQuerying(false);
      setIsStreaming(true);

      const assistantMsgId = `asst-${Date.now()}`;
      setActiveMessageId(assistantMsgId);

      // Initialize assistant message with empty streaming text
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: '',
        timestamp: new Date().toTimeString().split(' ')[0],
        toolCalls: res.toolCalls,
        sourceRecords: res.sourceRecords,
        suggestedActions: res.suggestedActions,
        relevantRooms: res.relevantRooms,
        source: res.source,
        degradedMode: res.degradedMode,
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Expand "Data used" by default for easy review
      setExpandedDataUsed((prev) => ({
        ...prev,
        [assistantMsgId]: true,
      }));

      // Fast streaming effect (words in ~25ms intervals)
      const words = res.answer.split(' ');
      let currentWordIndex = 0;
      let accumulatedText = '';

      const intervalId = setInterval(() => {
        if (cancelStreamRef.current) {
          clearInterval(intervalId);
          setIsStreaming(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, isStreaming: false } : m
            )
          );
          return;
        }

        if (currentWordIndex < words.length) {
          accumulatedText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex];
          currentWordIndex++;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, text: accumulatedText } : m
            )
          );
        } else {
          clearInterval(intervalId);
          setIsStreaming(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, isStreaming: false } : m
            )
          );
        }
      }, 25);
    } catch (err) {
      console.error('Failed to query campus assistant:', err);
      setIsQuerying(false);
      setIsStreaming(false);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Telemetry query failed. Data stream could not be synchronized with edge nodes.',
        timestamp: new Date().toTimeString().split(' ')[0],
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleRetry = () => {
    if (lastQueryText) {
      // Remove last error message
      setMessages((prev) => prev.filter((m) => !m.error));
      handleSend(lastQueryText);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Mode Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-hairline">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
              Operational Intelligence / Context Engine
            </span>
            <SourceBadge source={degradedMode ? 'SIMULATED' : 'LIVE'} size="sm" />
            <span className="text-[11px] font-mono text-muted">demo data</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight">
            Campus Data Assistant
          </h1>
          <p className="text-[14px] text-muted leading-relaxed">
            Deterministic data query engine grounded in real-time sensor streams and registered timetable records.
          </p>
        </div>

        {/* Diagnostic Mode Toggles */}
        <div className="flex items-center gap-2">
          {/* Degraded Mode Toggle */}
          <button
            type="button"
            onClick={() => setDegradedMode((prev) => !prev)}
            className={`px-3 py-1.5 rounded-[8px] border text-[11px] font-mono transition-colors cursor-pointer select-none flex items-center gap-1.5 ${
              degradedMode
                ? 'bg-status-yellow-soft text-status-yellow border-status-yellow/30 font-semibold'
                : 'bg-surface-2 text-muted border-hairline hover:text-ink'
            }`}
            title="Toggle between Live Intelligence and Degraded Local Fallback Mode"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                degradedMode ? 'bg-status-yellow' : 'bg-status-green'
              }`}
            />
            <span>Mode: {degradedMode ? 'Degraded Fallback' : 'Online'}</span>
          </button>

          {/* Test Error Toggle (to verify retry button) */}
          <button
            type="button"
            onClick={() => setForceErrorSimulation((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-[8px] border text-[11px] font-mono transition-colors cursor-pointer select-none ${
              forceErrorSimulation
                ? 'bg-status-red-soft text-status-red border-status-red/30'
                : 'bg-surface-2 text-muted border-hairline hover:text-ink'
            }`}
            title="Simulate service interruption to test Retry UI"
          >
            {forceErrorSimulation ? 'Simulate Failure: ON' : 'Fail Test: OFF'}
          </button>

          {/* Clear / Reset Conversation */}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setActiveMessageId(null);
              }}
              className="px-2.5 py-1.5 rounded-[8px] bg-surface-2 border border-hairline text-muted hover:text-ink text-[11px] font-mono transition-colors cursor-pointer"
              title="Clear conversation history"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 2. Degraded Mode Banner (shown when degradedMode is active) */}
      {degradedMode && (
        <div className="bg-status-yellow-soft/70 border border-status-yellow/30 rounded-[10px] p-3 px-4 flex items-center justify-between text-[13px] text-ink gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-status-yellow shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold block font-mono text-[12px] uppercase text-status-yellow">
                AI Service Degraded · Running Local Deterministic Mode
              </span>
              <span className="text-[12px] text-muted truncate block">
                External neural semantic inference is unavailable. Answers are resolved using local rule queries in services/api.ts.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDegradedMode(false)}
            className="text-[12px] font-mono font-medium text-ink hover:underline shrink-0 cursor-pointer"
          >
            Restore Online Mode
          </button>
        </div>
      )}

      {/* 3. Main Workspace: Centered Conversation (720px) + Right Sources Panel (320px) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
        {/* Left / Center Conversation Column (720px max) */}
        <div className="w-full max-w-[720px] flex-1 flex flex-col min-w-0">
          {/* Conversation Body */}
          <div className="space-y-4 min-h-[460px] pb-4">
            {messages.length === 0 ? (
              /* Empty State */
              <div className="py-10 px-6 rounded-[16px] border border-hairline bg-surface text-left space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-surface-2 border border-hairline font-mono text-[11px] text-muted">
                    <Database className="w-3.5 h-3.5 text-accent" />
                    <span>CAMPUSCARE DATA ENGINE</span>
                  </div>
                  <h2 className="text-[22px] font-semibold text-ink tracking-tight">
                    Welcome. How can I query campus telemetry for you?
                  </h2>
                  <p className="text-[14px] text-muted leading-relaxed max-w-xl">
                    I query physical Raspberry Pi sensor telemetry, timetable schedule allocations, and sub-meter energy draw. Select a suggested prompt or ask directly.
                  </p>
                </div>

                {/* 6 Suggested Prompts Chips */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold block">
                    Suggested Operational Prompts
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSend(prompt)}
                        className="text-left p-3 rounded-[8px] bg-surface-2 border border-hairline hover:border-accent hover:bg-surface transition-all text-[13px] font-medium text-ink cursor-pointer group flex items-center justify-between"
                      >
                        <span className="group-hover:text-accent transition-colors">
                          {prompt}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted opacity-40 group-hover:opacity-100 group-hover:text-accent shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Message Thread */
              <div className="space-y-5">
                {messages.map((msg) => {
                  if (msg.sender === 'user') {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="max-w-[85%] bg-accent-soft text-ink border border-accent/20 rounded-[12px] p-3.5 px-4 shadow-none space-y-1">
                          <p className="text-[14px] leading-relaxed whitespace-pre-wrap font-medium">
                            {msg.text}
                          </p>
                          <span className="font-mono text-[10px] text-muted text-right block tabular-nums">
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // Assistant message: plain surface with NO avatar glow
                  const isInspected = inspectedMessage?.id === msg.id;
                  const isDataExpanded = expandedDataUsed[msg.id] ?? false;

                  return (
                    <div
                      key={msg.id}
                      onClick={() => setActiveMessageId(msg.id)}
                      className={`relative flex flex-col gap-2 rounded-[12px] border p-4 transition-colors ${
                        isInspected
                          ? 'border-hairline bg-surface ring-1 ring-accent/30'
                          : 'border-hairline bg-surface hover:border-hairline/80'
                      }`}
                    >
                      {/* Top Header of assistant answer */}
                      <div className="flex items-center justify-between text-[11px] font-mono pb-2 border-b border-hairline/60">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink uppercase tracking-wider">
                            CAMPUS DATA
                          </span>
                          {msg.source && <SourceBadge source={msg.source} size="sm" />}
                          {msg.degradedMode && (
                            <span className="px-1.5 py-0.2 rounded bg-status-yellow-soft text-status-yellow font-bold text-[10px]">
                              FALLBACK
                            </span>
                          )}
                        </div>
                        <span className="text-muted tabular-nums">{msg.timestamp}</span>
                      </div>

                      {/* Main Message Text */}
                      <div className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap pt-1">
                        {msg.text}
                        {msg.isStreaming && (
                          <span className="inline-block w-1.5 h-4 ml-1 bg-accent animate-pulse align-middle" />
                        )}
                      </div>

                      {/* Error state with Retry button */}
                      {msg.error && (
                        <div className="pt-2 flex items-center gap-3">
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                            onClick={handleRetry}
                          >
                            Retry Query
                          </Button>
                          <span className="text-[12px] text-muted">
                            Failed to synchronize gateway telemetry.
                          </span>
                        </div>
                      )}

                      {/* Collapsible "Data used" row listing tool calls */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-hairline">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDataUsed(msg.id);
                            }}
                            className="flex items-center gap-2 text-[12px] font-mono text-muted hover:text-ink cursor-pointer select-none transition-colors"
                          >
                            {isDataExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-accent" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-muted" />
                            )}
                            <span className="font-semibold uppercase tracking-wider text-ink">
                              Data Used ({msg.toolCalls.length} tool {msg.toolCalls.length === 1 ? 'call' : 'calls'})
                            </span>
                          </button>

                          {isDataExpanded && (
                            <div className="mt-2 space-y-2 pl-5 pt-1">
                              {msg.toolCalls.map((tc) => (
                                <div
                                  key={tc.id}
                                  className="flex items-center justify-between p-2 rounded-[6px] bg-surface-2 border border-hairline text-[12px] font-mono"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-accent font-semibold truncate">
                                      {tc.tool}
                                    </span>
                                    <span className="text-muted text-[11px] shrink-0">
                                      → {tc.resultSummary}
                                    </span>
                                  </div>
                                  <SourceBadge source={tc.source} size="sm" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Inline Suggested Follow-ups */}
                      {msg.suggestedActions && msg.suggestedActions.length > 0 && !msg.isStreaming && (
                        <div className="mt-3 pt-2 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-mono text-muted uppercase">
                            Follow-up:
                          </span>
                          {msg.suggestedActions.map((action) => (
                            <button
                              key={action}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSend(action);
                              }}
                              className="px-2.5 py-1 rounded-[6px] bg-surface-2 border border-hairline hover:border-accent text-[12px] text-ink transition-colors cursor-pointer font-medium"
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Three static-weight dots typing indicator */}
                {isQuerying && (
                  <div className="mr-auto max-w-sm rounded-[12px] border border-hairline bg-surface p-4 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-muted">
                      <span>CAMPUS DATA ENGINE</span>
                      <SourceBadge source="LIVE" size="sm" />
                    </div>
                    <div className="flex items-center gap-1.5 py-1" aria-label="Thinking">
                      <span className="w-2 h-2 rounded-full bg-muted/60" />
                      <span className="w-2 h-2 rounded-full bg-muted/60" />
                      <span className="w-2 h-2 rounded-full bg-muted/60" />
                      <span className="font-mono text-[11px] text-muted ml-2">
                        Querying telemetry...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Bar & Controls */}
          <div className="sticky bottom-0 bg-bg pt-2 pb-1 space-y-2">
            {/* Active streaming stop button */}
            {isStreaming && (
              <div className="flex justify-center pb-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleStopStreaming}
                  leftIcon={<Square className="w-3 h-3 fill-current" />}
                  className="bg-surface [box-shadow:var(--shadow-popover)]"
                >
                  Stop Generating
                </Button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-center rounded-[10px] bg-surface border border-hairline focus-within:border-accent transition-colors [box-shadow:var(--shadow-popover)]"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about classrooms, sensor heartbeats, or energy waste..."
                disabled={isQuerying || isStreaming}
                className="flex-1 py-3 pl-4 pr-12 text-[14px] bg-transparent text-ink placeholder:text-muted focus:outline-none disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!input.trim() || isQuerying || isStreaming}
                className="absolute right-2 p-2 rounded-[6px] bg-accent text-white dark:text-bg hover:opacity-90 disabled:opacity-30 disabled:pointer-events-none transition-opacity cursor-pointer"
                title="Send query"
                aria-label="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Safety Copy under the input */}
            <p className="text-[11.5px] text-muted text-center leading-normal">
              Answers come from campus data. If data is unavailable, the assistant will say so.
            </p>
          </div>
        </div>

        {/* Right "Sources" Panel (320px fixed) */}
        <aside
          aria-label="Sources"
          className="w-full lg:w-[320px] shrink-0 sticky top-4 bg-surface border border-hairline rounded-[12px] p-4 flex flex-col gap-4 max-h-[calc(100vh-140px)] overflow-y-auto select-none"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between pb-3 border-b border-hairline">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-accent" />
              <h3 className="text-[14px] font-bold text-ink tracking-tight uppercase font-mono">
                Sources & Telemetry
              </h3>
            </div>
            {inspectedMessage?.sourceRecords && (
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-2 text-muted border border-hairline">
                {inspectedMessage.sourceRecords.length} records
              </span>
            )}
          </div>

          {/* Sources Content */}
          {!inspectedMessage?.sourceRecords || inspectedMessage.sourceRecords.length === 0 ? (
            <div className="py-8 px-2 text-center space-y-2">
              <Database className="w-8 h-8 text-muted/40 mx-auto" />
              <p className="text-[13px] font-medium text-ink">
                No telemetry sources cited yet
              </p>
              <p className="text-[12px] text-muted leading-relaxed">
                When you query campus spaces, verified records and device references will be detailed here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold block">
                Matching Database Records
              </span>

              {inspectedMessage.sourceRecords.map((rec) => {
                const categoryIcon = {
                  Room: <Building2 className="w-3.5 h-3.5 text-accent shrink-0" />,
                  Alert: <BellRing className="w-3.5 h-3.5 text-status-orange shrink-0" />,
                  Device: <Cpu className="w-3.5 h-3.5 text-status-yellow shrink-0" />,
                  Timetable: <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />,
                  Energy: <Zap className="w-3.5 h-3.5 text-accent shrink-0" />,
                  Sensor: <Radio className="w-3.5 h-3.5 text-status-green shrink-0" />,
                }[rec.category] || <Database className="w-3.5 h-3.5 text-muted shrink-0" />;

                return (
                  <div
                    key={rec.id}
                    className="p-3 rounded-[8px] bg-surface-2 border border-hairline space-y-2 text-[12px] group hover:border-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {categoryIcon}
                        <span className="font-semibold text-ink truncate text-[12.5px]">
                          {rec.title}
                        </span>
                      </div>
                      <SourceBadge source={rec.source} size="sm" />
                    </div>

                    {rec.subtitle && (
                      <p className="font-mono text-[11px] text-muted truncate">
                        {rec.subtitle}
                      </p>
                    )}

                    {rec.details && (
                      <p className="text-[11.5px] text-muted leading-relaxed line-clamp-2">
                        {rec.details}
                      </p>
                    )}

                    {/* Metrics Breakdown if available */}
                    {rec.metrics && (
                      <div className="pt-2 border-t border-hairline/60 grid grid-cols-2 gap-1 font-mono text-[10.5px]">
                        {Object.entries(rec.metrics).map(([k, v]) => (
                          <div key={k} className="truncate">
                            <span className="text-muted">{k}: </span>
                            <span className="text-ink font-semibold">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Link button if target route exists */}
                    {rec.link && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onNavigate(rec.link!)}
                          className="flex items-center gap-1 font-mono text-[10.5px] text-accent hover:underline cursor-pointer"
                        >
                          <span>Open Record</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Context Footer */}
          <div className="mt-auto pt-3 border-t border-hairline space-y-1 text-[11px] font-mono text-muted">
            <div className="flex items-center justify-between">
              <span>Active Gateway</span>
              <span className="text-ink font-semibold">PI-GW-CSE-02</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sync Frequency</span>
              <span className="text-ink font-semibold">10s telemetry</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

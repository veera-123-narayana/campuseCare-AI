import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Leaf,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { api } from '../services/api';
import { SourceBadge } from '../components/ui/SourceBadge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

interface AssistantPageProps {
  onNavigate: (path: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  suggestedActions?: string[];
  relevantRooms?: string[];
  timestamp: string;
  source?: 'SIMULATED' | 'LIVE' | 'PI';
}

export const AssistantPage: React.FC<AssistantPageProps> = ({ onNavigate }) => {
  const { dataMode } = useCampus();
  const [input, setInput] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-init',
      sender: 'assistant',
      text: 'CAMPUSCARE Operational Intelligence Engine online. I continuously cross-reference timetable bookings with edge Raspberry Pi sensors to identify unconfirmed activity and support UN SDG 11 targets.',
      suggestedActions: [
        'Inspect Room 204 Discrepancy',
        'Analyze Today’s Energy Waste',
        'Review Active Perimeter Dispatches',
      ],
      timestamp: '10:18:22',
      source: 'SIMULATED',
    },
  ]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || input;
    if (!q.trim() || isQuerying) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toTimeString().split(' ')[0],
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsQuerying(true);

    try {
      const res = await api.askAssistant(q);
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        suggestedActions: res.suggestedActions,
        relevantRooms: res.relevantRooms,
        timestamp: new Date().toTimeString().split(' ')[0],
        source: res.source,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
              Operational Assistant
            </span>
            <SourceBadge source="SIMULATED" size="sm" />
            <span className="text-[11px] font-mono text-muted">demo data</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink">
            Campus Intelligence Assistant
          </h1>
          <p className="text-[14px] text-muted leading-relaxed">
            Query room status, verify grace window thresholds, and inspect energy setback recommendations.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={() => {
            setMessages([
              {
                id: 'm-init',
                sender: 'assistant',
                text: 'CAMPUSCARE Operational Intelligence Engine reset to initial state.',
                suggestedActions: ['Inspect Room 204 Discrepancy', 'Analyze Today’s Energy Waste'],
                timestamp: new Date().toTimeString().split(' ')[0],
                source: 'SIMULATED',
              },
            ]);
          }}
        >
          Reset Session
        </Button>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {[
          'Why is Room 204 drawing 3.4 kW with 0 headcount?',
          'What is our UN SDG 11 carbon reduction today?',
          'Show perimeter security status for LAB-AI-01',
          'Which classrooms have grace period expired?',
        ].map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(prompt)}
            className="text-[12px] bg-surface-2 hover:bg-surface border border-hairline hover:border-muted/50 px-3 py-1.5 rounded-[8px] text-ink transition-colors cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Conversation Container */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-2xl rounded-[12px] p-5 border text-[14px] leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-accent text-white dark:text-bg border-accent font-medium'
                  : 'bg-surface text-ink border-hairline'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2 text-[11px] font-mono opacity-80 border-b pb-1.5 border-current/20">
                <span>{msg.sender === 'user' ? 'Operator Query' : 'CAMPUSCARE Core'}</span>
                <div className="flex items-center gap-1.5">
                  {msg.source && <SourceBadge source={msg.source} size="sm" />}
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              <p className="whitespace-pre-line">{msg.text}</p>

              {/* Action buttons if assistant */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="pt-3 mt-3 border-t border-hairline flex flex-wrap gap-2">
                  {msg.suggestedActions.map((action, i) => (
                    <Button
                      key={i}
                      variant="secondary"
                      size="sm"
                      rightIcon={<ArrowRight className="w-3 h-3" />}
                      onClick={() => {
                        if (action.includes('Room 204') || action.includes('Setback')) {
                          onNavigate('/rooms/room-204');
                        } else if (action.includes('Perimeter') || action.includes('LAB-AI-01')) {
                          onNavigate('/emergency');
                        } else if (action.includes('Energy') || action.includes('SDG')) {
                          onNavigate('/sustainability');
                        } else {
                          handleSend(action);
                        }
                      }}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isQuerying && (
          <div className="max-w-md p-4 rounded-[12px] bg-surface border border-hairline space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="90%" />
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="sticky bottom-4 bg-surface border border-hairline rounded-[12px] p-2 flex items-center gap-2 [box-shadow:var(--shadow-popover)]"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about classroom activity, setback grace windows, or emergency alarms..."
          className="flex-1 bg-transparent px-3 py-2 text-[14px] text-ink placeholder:text-muted focus:outline-none"
        />
        <Button
          variant="primary"
          size="md"
          type="submit"
          disabled={!input.trim() || isQuerying}
          leftIcon={<Send className="w-4 h-4" />}
        >
          Ask
        </Button>
      </form>
    </div>
  );
};

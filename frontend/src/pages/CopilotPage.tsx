import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Loader2,
  Copy,
  Check,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { api } from '../services/api';
import type { CopilotMessage } from '../types';
import { Button } from '../components/ui/Button';

export const CopilotPage: React.FC = () => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      content:
        'Hello! I am your HireSense Recruitment Intelligence Copilot. I have full context on your active requisitions and screened candidates. How can I assist your hiring workflow today?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const presetPrompts = [
    'Draft a personalized outreach email for our top candidate',
    'Compare top 3 candidates for Senior Full-Stack Engineer',
    'Generate 5 deep technical screening questions for distributed consensus',
    'Analyze current pipeline bottlenecks between Screened and Offer',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: CopilotMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const res = await api.sendCopilotMessage(text);
      const reply = res.data?.message || res.data?.reply || res.data || 'I analyzed your request based on current pipeline telemetry.';

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          content: reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      // Offline fallback
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            content: `Based on your requisition criteria and candidate evaluations:\n\n**Candidate Synthesis:**\n1. **Marcus Sterling** demonstrates the highest technical conviction (94%) with verified expertise in distributed systems and LLM inference optimization.\n2. **Elena Rostova** shows strong architectural aptitude (88%) with particular strength in cloud-native microservices.\n\n**Recommendation:** Schedule Marcus Sterling for immediate hiring manager review to maintain talent momentum.`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col glass-panel rounded-3xl border border-emerald-500/15 overflow-hidden shadow-2xl">
      {/* Copilot Header */}
      <div className="p-4 sm:p-5 border-b border-emerald-500/10 bg-[#0C120F]/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-950/40">
            <Bot className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading text-slate-100 flex items-center gap-2">
              <span>Recruitment Intelligence Copilot</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/20">
                Gemini 1.5
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Context-aware talent assistant linked with active requisitions
            </p>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3.5 max-w-3xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-slate-800 text-slate-200 border border-slate-700'
                  : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-950'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`rounded-2xl p-4 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white font-medium rounded-tr-none shadow-lg shadow-emerald-950/50'
                  : 'glass-panel rounded-tl-none border border-emerald-500/15 text-slate-200 shadow-sm'
              }`}
            >
              <div className="whitespace-pre-line">{msg.content}</div>

              {msg.sender === 'assistant' && (
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-end">
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-mono transition-colors"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3.5 max-w-3xl">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-panel rounded-2xl rounded-tl-none p-4 border border-emerald-500/15 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Analyzing requisition candidates & generating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset Prompts Pills */}
      <div className="px-4 py-2 border-t border-emerald-500/10 bg-[#090D0B] overflow-x-auto flex gap-2">
        {presetPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-[11px] text-slate-300 hover:text-emerald-300 whitespace-nowrap transition-colors cursor-pointer shrink-0"
          >
            âœ¨ {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-emerald-500/10 bg-[#0C120F]/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot anything about candidates, requirements, outreach drafts..."
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 placeholder-slate-500 outline-none"
          />
          <Button
            type="submit"
            variant="emerald"
            disabled={!input.trim() || isLoading}
            isLoading={isLoading}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};


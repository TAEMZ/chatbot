'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LeadData {
  id: string;
  name: string;
  website_url: string;
  assistant_id: string;
  business_data: {
    business_name: string;
    services: string[];
    value_proposition: string;
  };
}

export default function DemoPage({ params }: { params: Promise<{ token: string }> }) {
  // Unwrap the params Promise (Next.js 15+)
  const { token } = use(params);

  const [lead, setLead] = useState<LeadData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);  // Initial page load
  const [sending, setSending] = useState(false);  // Chat message sending
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch lead data by demo token
    async function fetchLead() {
      const { data, error: fetchError } = await supabase
        .from('magic_link_leads')
        .select('*')
        .eq('demo_token', token)
        .single();

      if (fetchError || !data) {
        setError('Demo not found or has expired');
        setLoading(false);
        return;
      }

      // Parse business_data if it's a JSON string
      const leadData: LeadData = {
        ...data,
        business_data: typeof data.business_data === 'string'
          ? JSON.parse(data.business_data)
          : data.business_data
      };

      setLead(leadData);
      setLoading(false);

      // Track demo opened
      await supabase
        .from('magic_link_leads')
        .update({ demo_opened_at: new Date().toISOString() })
        .eq('id', data.id);
    }
    fetchLead();
  }, [token]);

  async function sendMessage() {
    if (!input.trim() || !lead) return;

    setSending(true);
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Chat endpoint (uses n8n's OpenAI credentials)
      const res = await fetch('https://n8n.thebrownmine.com/webhook/magic-link-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          threadId: threadId,      // null on first message
          assistantId: lead.assistant_id
        })
      });

      const data = await res.json();

      // Update threadId if this was the first message
      if (data.threadId && !threadId) {
        setThreadId(data.threadId);
      }

      // Add assistant response to messages
      if (data.response) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response
        }]);
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your message.'
      }]);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return <div className="flex items-center justify-center h-screen">No data found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-500">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Live Experience</span>
            </div>
            <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300">
              {lead.business_data.business_name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-xl">
              {lead.business_data.value_proposition}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Preparing for</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{lead.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Website Preview Window */}
        <div className="group relative bg-slate-900 rounded-2xl shadow-2xl shadow-indigo-500/10 border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-indigo-500/20">
          {/* Browser Top Bar */}
          <div className="bg-slate-100 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
            </div>
            <div className="bg-white dark:bg-slate-900 px-4 py-1.5 rounded-md text-[11px] text-slate-400 dark:text-slate-500 font-mono border border-slate-200/50 dark:border-slate-700/50 w-1/2 text-center truncate">
              {lead.website_url}
            </div>
            <div className="w-12" />
          </div>

          <iframe
            src={lead.website_url}
            className="w-full h-[calc(100vh-280px)] min-h-[500px] bg-white"
            title="Website Preview"
          />
        </div>
      </main>

      {/* Chat Widget */}
      <div className="fixed bottom-0 right-0 w-full md:w-[400px] md:m-6 z-50">
        <div className="bg-white dark:bg-slate-900 md:rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[600px] animate-in slide-in-from-bottom-5 duration-500">

          {/* Chat Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-lg">AI Assistant</h3>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-white/80 font-medium">Ready to help you</span>
              </div>
            </div>
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/10 text-white/40">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 h-[400px] overflow-y-auto p-6 space-y-4 scroll-smooth">
            {messages.length === 0 && (
              <div className="py-12 px-4 text-center">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-800/50">
                  <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-slate-800 dark:text-slate-200 font-bold mb-1">Hey there!</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Ask me anything about <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{lead.business_data.business_name}</span>. I'm here to help!
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-200 dark:shadow-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                  }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area - FIXED COLORS */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="relative flex items-end gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your question..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm py-2 px-3 resize-none min-h-[40px] max-h-[120px]"
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white p-2.5 rounded-lg transition-all shadow-md active:scale-95 flex items-center justify-center shrink-0"
              >
                <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium tracking-tight">
              Powered by <span className="text-indigo-500/80 font-bold">Mant Automations</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

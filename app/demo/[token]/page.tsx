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
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f8fafc] dark:bg-[#0f172a]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Authenticating Portal</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8fafc] dark:bg-[#0f172a]">
        <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Access Denied</h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium mb-8 leading-relaxed">{error}</p>
          <a href="/" className="inline-block py-3 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm">Return to Hub</a>
        </div>
      </div>
    );
  }

  if (!lead) {
    return <div className="flex items-center justify-center h-screen">No data found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-500">
      {/* Background Decor - Subtle */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-25">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-slate-300 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center">
              <img src="/logo.png" alt="Brownmine" className="max-w-full max-h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                {lead.business_data.business_name}
              </h1>
              <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-[0.2em]">
                Strategic Dashboard
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-right">
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">Authenticated Lead</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{lead.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Strategy Context Card */}
        <div className="mb-8 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-indigo-600" />
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Overview</h2>
            </div>
            <p className="text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {lead.business_data.value_proposition}
            </p>
          </div>
          <div className="w-full md:w-64 bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Key Verticals</h3>
            <ul className="space-y-3">
              {lead.business_data.services.slice(0, 3).map((service, i) => (
                <li key={i} className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                  {service}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Website Preview Window */}
        <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all">
          {/* Browser Top Bar */}
          <div className="bg-slate-100 dark:bg-slate-800/90 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="bg-white dark:bg-slate-950 px-6 py-2 rounded-full text-[11px] text-slate-400 font-mono border border-slate-200 dark:border-slate-800 w-1/2 text-center truncate">
              {lead.website_url}
            </div>
            <div className="w-16" />
          </div>

          <iframe
            src={lead.website_url}
            className="w-full h-[calc(100vh-320px)] min-h-[500px] bg-white transition-opacity"
            title="Website Preview"
          />
        </div>
      </main>

      {/* Chat Widget - Corporate/Brownmine */}
      <div className="fixed bottom-0 right-0 w-full md:w-[400px] md:m-8 z-50">
        <div className="bg-white dark:bg-slate-900 md:rounded-[2rem] shadow-[0_30px_60px_rgba(15,23,42,0.15)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[600px]">

          {/* Chat Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-2 border border-slate-800">
                <img src="/logo.png" alt="BM" className="max-w-full max-h-full" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Brownmine Support</h3>
                <div className="flex items-center gap-2 leading-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Active Intelligence</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 h-[380px] overflow-y-auto p-6 space-y-4 scroll-smooth bg-[#fcfdfe] dark:bg-slate-900">
            {messages.length === 0 && (
              <div className="py-8 px-6 text-center">
                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-5 p-2">
                  <img src="/logo.png" alt="Logo" className="opacity-10 grayscale" />
                </div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Institutional Briefing</h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-bold">
                  Initialized Strategic Assistant for <span className="text-slate-900 dark:text-white underline decoration-indigo-500/30 underline-offset-4">{lead.business_data.business_name}</span>.
                  How can I assist with your business intelligence today?
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-5 py-3 rounded-[1.25rem] text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700'
                  }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 px-5 py-3 rounded-[1.25rem] rounded-bl-none border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Processing Data</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area - PROFESSIONAL */}
          <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
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
                placeholder="Ask a strategic question..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm py-0.5 resize-none font-medium"
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="text-indigo-600 hover:text-indigo-700 disabled:opacity-30 p-1 group transition-all"
              >
                <svg className="w-7 h-7 rotate-90 group-active:scale-90 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Secure Portal</span>
              </div>
              <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em] transform skew-x-[-10deg]">BROWN MINE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

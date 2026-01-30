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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow p-4">
        <h1 className="text-xl font-bold">{lead.business_data.business_name}</h1>
        <p className="text-gray-600 text-sm">{lead.business_data.value_proposition}</p>
      </header>

      {/* Website Preview */}
      <div className="p-4">
        <iframe
          src={lead.website_url}
          className="w-full h-64 border rounded-lg shadow"
          title="Website Preview"
        />
      </div>

      {/* Chat Widget */}
      <div className="fixed bottom-0 right-0 w-full md:w-96 md:m-4">
        <div className="bg-white rounded-t-lg md:rounded-lg shadow-xl border">
          <div className="bg-blue-600 text-white p-3 rounded-t-lg">
            <h3 className="font-semibold">Chat with AI Assistant</h3>
            <p className="text-xs opacity-80">Powered by your business data</p>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-gray-500 text-center text-sm">
                Ask me anything about {lead.business_data.business_name}!
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
                  }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              disabled={sending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

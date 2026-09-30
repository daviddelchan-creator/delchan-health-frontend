'use client';

import React, { useState, useEffect } from 'react';

interface TimelineItem {
  id: string;
  type: 'email' | 'whatsapp' | 'unknown';
  body: string;
  timestamp: string;
  sender: string;
}

interface ChatterViewProps {
  threadId: string;
  patientEmail: string;
  patientPhone: string;
  tenantId: string;
}

export default function ChatterView({ threadId, patientEmail, patientPhone, tenantId }: ChatterViewProps) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [messageBody, setMessageBody] = useState('');
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');
  const [isSending, setIsSending] = useState(false);

  const fetchTimeline = async () => {
    try {
      const res = await fetch(`/api/tenant/messaging/timeline/${threadId}`);
      const data = await res.json();
      if (data.timeline) setTimeline(data.timeline);
    } catch (err) {
      console.error("Error pulling unified timeline indices from Medplum:", err);
    }
  };

  useEffect(() => {
    fetchTimeline();
    const interval = setInterval(fetchTimeline, 10000); // Polling index refresh every 10s
    return () => clearInterval(interval);
  }, [threadId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim()) return;
    setIsSending(true);

    try {
      // Post payload directly into our backend dynamic notification router
      await fetch(`/api/tenant/messaging/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          threadId,
          channel,
          to: channel === 'email' ? patientEmail : patientPhone,
          body: messageBody
        })
      });
      setMessageBody('');
      await fetchTimeline();
    } catch (err) {
      console.error("Message dispatch failure:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden font-sans text-white">
      {/* Upper Streaming Shell */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-zinc-900/40">
        {timeline.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-lg border max-w-[80%] ${
              item.type === 'whatsapp'
                ? 'bg-emerald-950/30 border-emerald-800/50 mr-auto'
                : 'bg-zinc-900 border-zinc-800 ml-auto'
            }`}
          >
            <div className="flex items-center justify-between mb-1 text-xs text-zinc-400">
              <span className="font-bold">{item.sender} ({item.type.toUpperCase()})</span>
              <span>{new Date(item.timestamp).toLocaleTimeString('pt-BR')}</span>
            </div>
            <p className="text-sm text-zinc-200 whitespace-pre-wrap">{item.body}</p>
          </div>
        ))}
      </div>

      {/* Message Dispatch Controller Box */}
      <form onSubmit={handleSendMessage} className="p-4 bg-zinc-950 border-t border-zinc-800 space-y-3">
        <div className="flex items-center space-x-4 text-sm">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              checked={channel === 'email'}
              onChange={() => setChannel('email')}
              className="accent-blue-500"
            />
            <span className={channel === 'email' ? 'text-blue-400 font-medium' : 'text-zinc-400'}>Correio Eletrônico</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              checked={channel === 'whatsapp'}
              onChange={() => setChannel('whatsapp')}
              className="accent-emerald-500"
            />
            <span className={channel === 'whatsapp' ? 'text-emerald-400 font-medium' : 'text-zinc-400'}>WhatsApp API</span>
          </label>
        </div>

        <div className="flex space-x-2">
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder={`Responder via ${channel === 'email' ? 'E-mail' : 'WhatsApp'}...`}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-zinc-700 resize-none h-12"
          />
          <button
            type="submit"
            disabled={isSending}
            className={`px-4 rounded-lg text-sm font-semibold transition ${
              channel === 'email'
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            } disabled:opacity-50`}
          >
            {isSending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}
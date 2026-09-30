'use client';

import React, { useState, useEffect } from 'react';
import { useMedplum } from '@medplum/react-hooks';
import { Communication } from '@medplum/fhirtypes';
import DOMPurify from 'dompurify';

interface ChatterTimelineProps {
  resourceType: string;
  resourceId: string;
}

const DELCHAN_EXT_URL = 'http://delchan.site';

export default function ChatterTimeline({ resourceType, resourceId }: ChatterTimelineProps) {
  const medplum = useMedplum();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp'>('email');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchCommunications();
  }, [resourceType, resourceId]);

  const fetchCommunications = async () => {
    setLoading(true);
    try {
      // Query communications part of this resource
      const searchResult = await medplum.searchResources('Communication', {
        partOf: `${resourceType}/${resourceId}`,
        _sort: 'sent',
      });
      setCommunications(searchResult as Communication[]);
    } catch (err: any) {
      console.error('Error fetching communications:', err);
      setError('No se pudieron cargar los mensajes.');
    } finally {
      setLoading(false);
    }
  };

  const getChannelType = (comm: Communication): 'email' | 'whatsapp' | 'unknown' => {
    const channelExt = comm.extension?.find((ext) => ext.url === DELCHAN_EXT_URL && (ext.valueString === 'email' || ext.valueString === 'whatsapp'));
    return (channelExt?.valueString as 'email' | 'whatsapp') || 'unknown';
  };

  const handleSend = async () => {
    if (!message.trim() || !recipient.trim()) return;

    setSending(true);
    try {
      // Get the last communication id to set as parentId if threading is desired
      let parentId: string | undefined = undefined;
      if (communications.length > 0) {
          const lastComm = communications[communications.length - 1];
          parentId = lastComm.id;
      }

      const res = await fetch('/api/chatter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceType,
          resourceId,
          channel: activeTab,
          message,
          recipient,
          parentId,
          subject: `Actualización de ticket ${resourceType}/${resourceId}`, // Default subject
        }),
      });

      if (!res.ok) {
        throw new Error('Error al enviar mensaje');
      }

      setMessage('');
      fetchCommunications(); // Reload to show new message
    } catch (err: any) {
      console.error(err);
      alert('Hubo un error al enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      {loading && <div className="p-4 text-center">Cargando chatter...</div>}
      {error && <div className="p-4 text-center text-red-500">{error}</div>}

      <h3 className="text-lg font-semibold mb-4 text-gray-800">Historial de Conversación</h3>

      {/* Timeline view */}
      {!loading && !error && (
      <div className="relative border-l-2 border-gray-200 ml-4 mb-8 space-y-6">
        {communications.map((comm) => {
          const channel = getChannelType(comm);
          const isEmail = channel === 'email';
          const isWhatsApp = channel === 'whatsapp';

          const sentDate = comm.sent ? new Date(comm.sent) : comm.meta?.lastUpdated ? new Date(comm.meta.lastUpdated) : new Date();
          const formattedDate = new Intl.DateTimeFormat('es-ES', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(sentDate);

          const senderName = comm.sender?.display || 'Desconocido';
          const content = comm.payload?.[0]?.contentString || '';

          return (
            <div key={comm.id} className="relative pl-8">
              {/* Timeline Icon */}
              <div className={`absolute -left-4 top-0 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-lg shadow-sm
                ${isEmail ? 'bg-blue-100 text-blue-600' : isWhatsApp ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                {isEmail ? '📧' : isWhatsApp ? '💬' : '📎'}
              </div>

              {/* Message Bubble */}
              <div className={`p-4 rounded-lg shadow-sm border
                ${isEmail ? 'bg-gray-50 border-gray-200' : isWhatsApp ? 'bg-green-50 border-green-200 text-green-900' : 'bg-gray-50'}`}>

                <div className="flex justify-between items-center mb-2">
                  <div className="flex space-x-2">
                     <span className="font-semibold text-sm">{senderName}</span>
                     {comm.payload?.[0]?.extension?.find(e => e.url === 'subject')?.valueString && (
                        <span className="text-sm font-medium text-gray-600">
                           Asunto: {comm.payload[0].extension.find(e => e.url === 'subject')?.valueString}
                        </span>
                     )}
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-xs text-gray-500">{formattedDate}</span>
                     <span className="text-xs font-semibold uppercase text-gray-400">{comm.status === 'completed' ? 'Enviado' : 'Recibido'}</span>
                  </div>
                </div>

                <div className="text-sm mt-2">
                  {isEmail ? (
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
                  ) : (
                    <p className="whitespace-pre-wrap">{content}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {communications.length === 0 && (
          <div className="pl-8 text-sm text-gray-500 italic">No hay mensajes aún.</div>
        )}
      </div>
      )}

      {/* Input Area */}
      <div className="mt-6 border-t pt-4">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
              ${activeTab === 'email' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Enviar Email
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
              ${activeTab === 'whatsapp' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Enviar WhatsApp
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder={activeTab === 'email' ? 'Correo destinatario...' : 'Número de WhatsApp...'}
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
          />
          <textarea
            rows={4}
            placeholder={activeTab === 'email' ? 'Escribe tu correo aquí...' : 'Escribe tu mensaje de WhatsApp...'}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSend}
              disabled={sending || !message.trim() || !recipient.trim()}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white shadow-sm
                ${activeTab === 'email' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

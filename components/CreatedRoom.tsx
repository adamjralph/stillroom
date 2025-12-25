import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Copy, ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from './Shared';

export const CreatedRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  // Construct the exact URL format requested: BASE_URL#/r/ID
  const getRoomUrl = () => {
    const baseUrl = window.location.href.split('#')[0].split('?')[0];
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBase}#/r/${id}`;
  };

  const copyLink = () => {
    const url = getRoomUrl();
    navigator.clipboard.writeText(url).catch(() => console.warn('Clipboard failed'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roomUrl = getRoomUrl();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 animate-fade-in-up">
      <div className="w-full max-w-lg text-center">
        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={32} />
        </div>
        
        <h2 className="text-2xl font-light text-neutral-900 mb-2">Room created</h2>
        <p className="text-neutral-500 mb-8">Your private preview room is ready.</p>
        
        <div className="bg-neutral-50 p-4 rounded-sm mb-8 border border-neutral-100 text-left">
          <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
            Shareable Link
          </label>
          <div className="flex items-center gap-3">
             <div className="flex-1 font-mono text-sm text-neutral-600 truncate bg-white border border-neutral-200 p-2 rounded-sm select-all">
               {roomUrl}
             </div>
             <Button onClick={copyLink} variant="secondary" className="px-4 py-2 text-xs shrink-0">
               {copied ? 'Copied' : 'Copy'}
             </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <a href={roomUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" className="w-full">
              Open room <ExternalLink size={14} className="ml-2" />
            </Button>
          </a>
          
          <Link to="/">
            <Button variant="ghost" className="w-full">
              <ArrowLeft size={14} className="mr-2" /> Back to creator
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Lock, Play } from 'lucide-react';
import { Room } from '../types';
import { roomService } from '../services/roomService';
import { Button } from './Shared';

const Lightbox = ({ 
  assets, 
  initialIndex, 
  onClose 
}: { 
  assets: Room['assets'], 
  initialIndex: number, 
  onClose: () => void 
}) => {
  const [index, setIndex] = useState(initialIndex);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex((prev) => (prev + 1) % assets.length);
  };
  
  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex((prev) => (prev - 1 + assets.length) % assets.length);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center animate-fade-in" onClick={onClose}>
      <button onClick={onClose} className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-neutral-900 z-50">
        <X size={24} />
      </button>
      
      <div className="relative w-full h-full flex items-center justify-center px-4 md:px-20 py-12" onClick={e => e.stopPropagation()}>
         {assets.length > 1 && (
           <button onClick={prev} className="absolute left-4 md:left-8 p-4 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors">
             <ChevronLeft size={32} />
           </button>
         )}
         
         <img 
           src={assets[index].url} 
           alt="" 
           className="max-w-full max-h-full object-contain shadow-2xl" 
         />

         {assets.length > 1 && (
           <button onClick={next} className="absolute right-4 md:right-8 p-4 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors">
             <ChevronRight size={32} />
           </button>
         )}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-neutral-400 tracking-widest">
        {index + 1} / {assets.length}
      </div>
    </div>
  );
};

export const RoomViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      if (id) {
        try {
          const foundRoom = await roomService.getRoomById(id);
          setRoom(foundRoom);
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    };
    fetchRoom();
  }, [id]);

  const handleCta = () => {
    if (!room) return;
    if (room.cta.type === 'email') {
      window.location.href = `mailto:${room.cta.target}`;
    } else if (room.cta.type === 'call') {
      window.location.href = `tel:${room.cta.target}`;
    } else {
      window.open(room.cta.target, '_blank');
    }
  };

  const getVideoEmbed = (url: string) => {
    // Basic cleanup
    const cleanUrl = url.trim();

    // Loom Logic
    if (cleanUrl.includes('loom.com/share/')) {
       return { type: 'iframe', src: cleanUrl.replace('loom.com/share/', 'loom.com/embed/') };
    }
    
    // Fallback: Just return the link
    return { type: 'link', src: cleanUrl };
  };

  if (loading) return <div className="min-h-screen bg-white" />;

  // 404 or Not Found - "This preview is temporarily unavailable."
  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-neutral-900 animate-fade-in">
        <p className="text-lg font-light text-neutral-900">This preview is temporarily unavailable.</p>
      </div>
    );
  }

  // Expired State - "This preview has expired."
  if (room.status === 'expired') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-neutral-900 animate-fade-in">
         <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
           <Lock size={20} className="text-neutral-300" />
         </div>
         <p className="text-lg font-light text-neutral-900">This preview has expired.</p>
      </div>
    );
  }

  // Paused State (Explicit)
  if (room.status === 'paused') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-neutral-900 animate-fade-in">
         <p className="text-lg font-light text-neutral-900">This preview is temporarily unavailable.</p>
      </div>
    );
  }

  const videoData = room.videoUrl ? getVideoEmbed(room.videoUrl) : null;

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-100 animate-fade-in-up">
      {lightboxIndex !== null && (
        <Lightbox 
          assets={room.assets} 
          initialIndex={lightboxIndex} 
          onClose={() => setLightboxIndex(null)} 
        />
      )}

      <main className="max-w-4xl mx-auto px-6 py-20 md:py-32">
        {/* Header */}
        <header className="mb-24 text-center">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">{room.clientName} — Concepts</h1>
          <p className="text-sm text-neutral-500 tracking-wide uppercase">Concepts prepared for {room.clientName} — {room.projectName}.</p>
        </header>

        {/* Gallery */}
        <div className="space-y-24">
          {room.assets.map((asset, index) => (
            <div 
              key={asset.id} 
              className="cursor-zoom-in transition-transform duration-500 hover:scale-[1.01]"
              onClick={() => setLightboxIndex(index)}
            >
              <img 
                src={asset.url} 
                alt="" 
                className="w-full h-auto shadow-sm block" 
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* Video Block */}
        {videoData && (
          <div className="mt-24">
            {videoData.type === 'iframe' ? (
              <div className="aspect-video w-full bg-neutral-50 rounded-sm overflow-hidden border border-neutral-100">
                <iframe 
                  src={videoData.src} 
                  className="w-full h-full" 
                  title="Video Content"
                  frameBorder="0" 
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="text-center py-8 bg-neutral-50 rounded-sm">
                <a 
                  href={videoData.src} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
                >
                  <Play size={16} /> Watch video
                </a>
              </div>
            )}
          </div>
        )}

        {/* Text Blocks - Pure Text Only */}
        {room.textBlocks && room.textBlocks.length > 0 && (
          <div className="mt-24 space-y-8 max-w-2xl mx-auto">
            {room.textBlocks.map((text, i) => (
              <p key={i} className="text-lg font-light leading-relaxed text-neutral-800 whitespace-pre-wrap">
                {text}
              </p>
            ))}
          </div>
        )}

        {/* Next Step */}
        <div className="mt-32 pt-16 border-t border-neutral-100 text-center">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-8">Next step</p>
          <Button onClick={handleCta} className="bg-neutral-900 text-white hover:bg-black px-12 py-4 text-base rounded-full shadow-lg hover:shadow-xl transition-all">
            {room.cta.label}
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 text-center text-neutral-400 text-[10px] tracking-wider uppercase bg-neutral-50/50">
        <div className="space-y-2">
          <p>private preview · not indexed</p>
          <p>
            We have taken all measures to protect your privacy. <span className="underline cursor-not-allowed hover:text-neutral-600">privacy policy</span>
          </p>
        </div>
      </footer>
    </div>
  );
};
import { apiCreateRoom } from "../services/roomsApi";
import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus, Trash2, Link as LinkIcon, ExternalLink, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Input, Label, Button } from './Shared';
import { AssetUploader } from './AssetUploader';
import { Room, CreateRoomFormValues, CtaType } from '../types';
import { roomService } from '../services/roomService';

// Internal component: The actual creator interface (protected)
const CreatorContent: React.FC = () => {
  const navigate = useNavigate();
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<CreateRoomFormValues>({
    clientName: '',
    projectName: '',
    assets: [],
    videoUrl: '',
    textBlocks: [],
    ctaType: 'call',
    ctaTarget: '',
    expiryDays: 7
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadRecentRooms();
  }, []);

  const loadRecentRooms = async () => {
    const rooms = await roomService.getAllRooms();
    setRecentRooms(rooms.slice(0, 5)); // Show last 5
  };

  const handleDeleteRoom = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this room? It will become unavailable immediately.')) {
      try {
        await roomService.deleteRoom(id);
        await loadRecentRooms();
      } catch (error) {
        console.error('Failed to delete room:', error);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setForm((prev) => {
        const oldIndex = prev.assets.findIndex((item) => item.id === active.id);
        const newIndex = prev.assets.findIndex((item) => item.id === over?.id);
        return {
          ...prev,
          assets: arrayMove(prev.assets, oldIndex, newIndex),
        };
      });
    }
  };

  const addTextBlock = () => {
    setForm(prev => ({
      ...prev,
      textBlocks: [...prev.textBlocks, { id: Math.random().toString(), value: '' }]
    }));
  };

  const updateTextBlock = (id: string, value: string) => {
    setForm(prev => ({
      ...prev,
      textBlocks: prev.textBlocks.map(tb => tb.id === id ? { ...tb, value } : tb)
    }));
  };

  const removeTextBlock = (id: string) => {
    setForm(prev => ({
      ...prev,
      textBlocks: prev.textBlocks.filter(tb => tb.id !== id)
    }));
  };

  const getCtaLabel = (type: CtaType): string => {
    switch(type) {
      case 'call': return 'Call Adam';
      case 'email': return 'Email Adam';
      case 'book': return 'Book a call';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.assets.length === 0) return alert('Please add at least one asset.');

    // Calculate expiry
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + form.expiryDays);

    try {
      const {id} = await apiCreateRoom({
        clientName: form.clientName,
        projectName: form.projectName,
        assets: form.assets.map((a, i) => ({ ...a, order: i })), // Ensure order is saved
        videoUrl: form.videoUrl || undefined,
        textBlocks: form.textBlocks.map(t => t.value).filter(Boolean),
        cta: {
          type: form.ctaType,
          label: getCtaLabel(form.ctaType),
          target: form.ctaTarget
        },
        expiresAt: expiryDate.getTime()
      });

      // Persist locally for quick recent access
      const roomForCache: Room = {
        id,
        clientName: form.clientName,
        projectName: form.projectName,
        assets: form.assets,
        videoUrl: form.videoUrl || undefined,
        textBlocks: form.textBlocks.map((t) => t.value).filter(Boolean),
        cta: {
          type: form.ctaType,
          label: getCtaLabel(form.ctaType),
          target: form.ctaTarget,
        },
        status: 'active',
        createdAt: Date.now(),
        expiresAt: expiryDate.getTime(),
      };

      try {
        await roomService.saveRoom(roomForCache);
        await loadRecentRooms();
      } catch (cacheError) {
        console.warn('Failed to update recent rooms cache', cacheError);
      }

      // Navigate to success/transition page
      try {
        navigate(`/created/${id}`);
      } catch {
        window.location.hash = `#/created/${id}`;
      }
      
    } catch (error: any) {
      console.error("Error creating room:", error);
      alert(error?.message || "Failed to create room. Please try again.");
    }
      

   // } catch (error) {
   //   console.error('Error creating room:', error);
   //   alert('Failed to create room. Please try again.');
   // }
  };

  // Robust URL generation for HashRouter
  const getRoomUrl = (id: string) => {
    let baseUrl = window.location.href.split('#')[0].split('?')[0];
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    return `${baseUrl}/#/r/${id}`;
  };

  const copyLink = (id: string) => {
    const url = getRoomUrl(id);
    navigator.clipboard.writeText(url).catch(() => {
      console.warn('Clipboard write failed');
    });
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-xl font-medium tracking-tight text-neutral-900">stillroom <span className="text-neutral-400 font-light ml-2">/ creator</span></h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-12 animate-fade-in">
          
          {/* 1 & 2: Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Client Name" 
              placeholder="e.g. Acme Corp" 
              required 
              value={form.clientName}
              onChange={e => setForm({...form, clientName: e.target.value})}
            />
            <Input 
              label="Project Name" 
              placeholder="e.g. Q3 Rebrand" 
              required 
              value={form.projectName}
              onChange={e => setForm({...form, projectName: e.target.value})}
            />
          </div>

          {/* 3: Assets */}
          <div>
            <Label>Assets (Required)</Label>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <AssetUploader assets={form.assets} onAssetsChange={assets => setForm({...form, assets})} />
            </DndContext>
            
            <div className="mt-4">
              <Input 
                placeholder="Optional: Video Embed URL (e.g. Loom, YouTube)" 
                value={form.videoUrl}
                onChange={e => setForm({...form, videoUrl: e.target.value})}
                className="text-xs"
              />
            </div>
          </div>

          {/* 4: Text Blocks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Text Blocks (Optional)</Label>
              <button type="button" onClick={addTextBlock} className="text-xs font-medium text-neutral-500 hover:text-neutral-900 flex items-center">
                <Plus size={12} className="mr-1" /> Add Block
              </button>
            </div>
            <div className="space-y-3">
              {form.textBlocks.map((block) => (
                <div key={block.id} className="flex gap-2 items-start">
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 bg-neutral-50 border border-transparent focus:bg-white focus:border-neutral-300 focus:ring-0 text-sm rounded-sm resize-none"
                    placeholder="Enter plain text context..."
                    value={block.value}
                    onChange={(e) => updateTextBlock(block.id, e.target.value)}
                  />
                  <button type="button" onClick={() => removeTextBlock(block.id)} className="p-2 text-neutral-300 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {form.textBlocks.length === 0 && (
                <p className="text-sm text-neutral-300 italic">No text blocks added.</p>
              )}
            </div>
          </div>

          {/* 5: CTA */}
          <div>
            <Label>Next Step CTA (Required)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select 
                className="w-full px-3 py-2.5 bg-neutral-50 border border-transparent focus:bg-white focus:border-neutral-300 focus:ring-0 text-sm rounded-sm"
                value={form.ctaType}
                onChange={(e) => setForm({...form, ctaType: e.target.value as CtaType})}
              >
                <option value="call">Call Adam</option>
                <option value="email">Email Adam</option>
                <option value="book">Book a call</option>
              </select>
              <Input 
                placeholder={form.ctaType === 'email' ? 'adam@example.com' : form.ctaType === 'call' ? '+1 555...' : 'https://cal.com/...'}
                required
                value={form.ctaTarget}
                onChange={e => setForm({...form, ctaTarget: e.target.value})}
              />
            </div>
          </div>

          {/* 6: Expiry */}
          <div>
            <Label>Expiry</Label>
            <div className="flex gap-6">
              {[7, 14, 30].map(days => (
                <label key={days} className="flex items-center cursor-pointer group">
                  <input 
                    type="radio" 
                    name="expiry" 
                    value={days}
                    checked={form.expiryDays === days}
                    onChange={() => setForm({...form, expiryDays: days})}
                    className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-500"
                  />
                  <span className="ml-2 text-sm text-neutral-600 group-hover:text-neutral-900">{days} days</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <Button type="submit" className="w-full md:w-auto">Create Private Room</Button>
          </div>

        </form>

        {/* Recent Rooms */}
        <div className="mt-24 pt-12 border-t border-neutral-100">
           <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-6">Recent Rooms</h3>
           <div className="space-y-4">
             {recentRooms.length === 0 ? (
               <p className="text-sm text-neutral-300">No rooms created yet.</p>
             ) : (
               recentRooms.map(room => {
                 const isExpired = Date.now() > room.expiresAt;
                 return (
                   <div key={room.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-sm">
                     <div>
                       <div className="text-sm font-medium text-neutral-900">{room.clientName} <span className="text-neutral-400">— {room.projectName}</span></div>
                       <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
                         <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-red-400' : 'bg-green-500'}`}></span>
                         {isExpired ? 'Expired' : 'Active'}
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <button 
                          onClick={() => copyLink(room.id)}
                          className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 px-3 py-1.5 bg-white border border-neutral-200 rounded-sm"
                       >
                         {copiedId === room.id ? 'Copied' : <><LinkIcon size={12} /> Copy</>}
                       </button>
                       <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="text-xs text-neutral-400 hover:text-red-500 px-2 py-1.5"
                          title="Delete room"
                       >
                         <Trash2 size={14} />
                       </button>
                     </div>
                   </div>
                 );
               })
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper component to handle Access Gate
export const Creator: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const isAuthed = sessionStorage.getItem('stillroom_authed') === '1';
    if (isAuthed) setIsAuthorized(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default to 'dev' if env var is not set
    // Fixed: Cast import.meta to any to resolve TS error: Property 'env' does not exist on type 'ImportMeta'
    const validKey = (import.meta as any).env?.VITE_STILLROOM_KEY || 'dev';
    
    if (accessKey === validKey) {
      sessionStorage.setItem('stillroom_authed', '1');
      setIsAuthorized(true);
      setError('');
    } else {
      setError('Incorrect key');
    }
  };

  if (isAuthorized) {
    return <CreatorContent />;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-[280px]">
        <h1 className="text-center text-xl font-medium tracking-tight text-neutral-900 mb-8">stillroom</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide">Access key</label>
            <input 
              type="password"
              className="w-full px-3 py-2.5 bg-neutral-50 border border-transparent focus:bg-white focus:border-neutral-300 focus:ring-0 transition-all duration-200 text-sm text-neutral-900 rounded-sm"
              value={accessKey}
              onChange={(e) => { setAccessKey(e.target.value); setError(''); }}
              autoFocus
            />
          </div>
          {error && <div className="text-xs text-red-500 text-center">{error}</div>}
          <button 
            type="submit" 
            className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-medium bg-neutral-900 text-white hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-sm transition-colors duration-200"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
};

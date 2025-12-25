import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Upload, X, GripVertical } from 'lucide-react';
import { Asset } from '../types';
import { roomService } from '../services/roomService';

interface AssetUploaderProps {
  assets: Asset[];
  onAssetsChange: (assets: Asset[]) => void;
}

interface SortableAssetItemProps {
  asset: Asset;
  onRemove: (id: string) => void;
}

// Sortable Item Component
const SortableAssetItem: React.FC<SortableAssetItemProps> = ({ asset, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: asset.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-square bg-neutral-50 border border-neutral-100 rounded-sm overflow-hidden"
    >
      <img src={asset.url} alt="Asset" className="w-full h-full object-cover" />
      
      {/* Remove Button */}
      <button
        type="button"
        onClick={() => onRemove(asset.id)}
        className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white text-neutral-500 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
      
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute top-2 left-2 p-1 bg-white/80 hover:bg-white text-neutral-500 cursor-grab active:cursor-grabbing rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical size={14} />
      </div>
    </div>
  );
};

export const AssetUploader: React.FC<AssetUploaderProps> = ({ assets, onAssetsChange }) => {
  const { setNodeRef } = useDroppable({ id: 'assets-droppable' });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAssets: Asset[] = [];
      const files: File[] = Array.from(e.target.files);

      for (const file of files) {
        // Simple client-side limit check to prevent browser crash on huge files
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} is too large (max 5MB).`);
          continue;
        }

        try {
          const base64 = await roomService.fileToBase64(file);
          newAssets.push({
            id: Math.random().toString(36).substr(2, 9),
            type: 'image',
            url: base64,
            order: assets.length + newAssets.length,
          });
        } catch (error) {
          console.error("Error reading file", error);
        }
      }
      
      onAssetsChange([...assets, ...newAssets]);
      // Reset input
      e.target.value = '';
    }
  };

  const removeAsset = (id: string) => {
    onAssetsChange(assets.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-4">
      <div ref={setNodeRef} className="grid grid-cols-3 sm:grid-cols-4 gap-4 min-h-[120px]">
        <SortableContext items={assets.map(a => a.id)} strategy={rectSortingStrategy}>
          {assets.map((asset) => (
            <SortableAssetItem key={asset.id} asset={asset} onRemove={removeAsset} />
          ))}
        </SortableContext>
        
        {/* Upload Button */}
        <label className="relative flex flex-col items-center justify-center aspect-square border-2 border-dashed border-neutral-200 rounded-sm hover:border-neutral-400 hover:bg-neutral-50 transition-colors cursor-pointer group">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
            />
            <div className="flex flex-col items-center space-y-2 text-neutral-400 group-hover:text-neutral-600">
              <Upload size={20} />
              <span className="text-xs font-medium">Add Images</span>
            </div>
        </label>
      </div>
      <p className="text-xs text-neutral-400">Drag images to reorder. First image is cover.</p>
    </div>
  );
};
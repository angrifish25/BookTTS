import { useMemo } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import type { AudioChunk } from '@/types';

interface ChunkTimelineProps {
  chunks: AudioChunk[];
  currentIndex: number;
  duration: number;
  onChunkClick: (index: number) => void;
}

export function ChunkTimeline({ chunks, currentIndex, duration, onChunkClick }: ChunkTimelineProps) {
  const segments = useMemo(() => {
    if (!duration || chunks.length === 0) return [];
    
    // Calculate segment positions
    // If chunks have durations, use them; otherwise distribute evenly
    const totalDuration = chunks.reduce((sum, c) => sum + (c.duration || 0), 0);
    const hasDurations = totalDuration > 0;
    
    let currentTime = 0;
    return chunks.map((chunk, index) => {
      const chunkDuration = hasDurations 
        ? (chunk.duration || 0) 
        : duration / chunks.length;
      
      const start = currentTime;
      const end = currentTime + chunkDuration;
      const width = ((chunkDuration / duration) * 100);
      
      currentTime = end;
      
      return {
        index,
        chunk,
        start,
        end,
        width: Math.max(width, 0.5), // Minimum width for visibility
      };
    });
  }, [chunks, duration]);

  const getStatusIcon = (status: AudioChunk['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={12} className="text-green-500" />;
      case 'processing':
        return <Loader2 size={12} className="text-amber-500 animate-spin" />;
      case 'error':
        return <Circle size={12} className="text-red-500" />;
      default:
        return <Circle size={12} className="text-surface-300" />;
    }
  };

  const getStatusColor = (status: AudioChunk['status'], isActive: boolean) => {
    if (isActive) return 'bg-primary-500 border-primary-600';
    
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300 hover:bg-green-200';
      case 'processing':
        return 'bg-amber-100 border-amber-300';
      case 'error':
        return 'bg-red-100 border-red-300 hover:bg-red-200';
      default:
        return 'bg-surface-100 border-surface-200 hover:bg-surface-200';
    }
  };

  return (
    <div className="w-full">
      {/* Timeline bar */}
      <div className="relative h-8 bg-surface-100 rounded-lg overflow-hidden flex">
        {segments.map(({ index, chunk, width }) => {
          const isActive = index === currentIndex;
          
          return (
            <button
              key={chunk.id}
              onClick={() => onChunkClick(index)}
              className={`
                relative h-full border-r border-white/50 last:border-r-0
                transition-all duration-200 cursor-pointer
                ${getStatusColor(chunk.status, isActive)}
                ${isActive ? 'z-10 shadow-sm' : ''}
              `}
              style={{ width: `${width}%` }}
              title={`${index + 1}. ${chunk.text.slice(0, 60)}${chunk.text.length > 60 ? '...' : ''}`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-primary-600" />
              )}
              
              {/* Status dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                {getStatusIcon(chunk.status)}
              </div>
              
              {/* Chunk number on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-medium text-surface-600 bg-white/80 px-1 rounded">
                  {index + 1}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Time markers */}
      <div className="flex justify-between text-[10px] text-surface-400 mt-1 px-1">
        <span>0:00</span>
        <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
      </div>
    </div>
  );
}

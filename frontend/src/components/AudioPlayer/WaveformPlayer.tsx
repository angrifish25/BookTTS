import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ChunkTimeline } from './ChunkTimeline';

// Dynamic import for wavesurfer to avoid SSR issues
let WaveSurfer: any;
let RegionsPlugin: any;
let HoverPlugin: any;
let TimelinePlugin: any;

async function loadWavesurfer() {
  if (!WaveSurfer) {
    const ws = await import('wavesurfer.js');
    const regions = await import('wavesurfer.js/dist/plugins/regions.js');
    const hover = await import('wavesurfer.js/dist/plugins/hover.js');
    const timeline = await import('wavesurfer.js/dist/plugins/timeline.js');
    WaveSurfer = ws.default;
    RegionsPlugin = regions.default;
    HoverPlugin = hover.default;
    TimelinePlugin = timeline.default;
  }
  return { WaveSurfer, RegionsPlugin, HoverPlugin, TimelinePlugin };
}

export function WaveformPlayer() {
  const waveformRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);
  const regionsRef = useRef<any>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [loop, setLoop] = useState(false);
  
  const isPlaying = useAppStore((s) => s.isPlaying);
  const setPlaying = useAppStore((s) => s.setPlaying);
  const chunks = useAppStore((s) => s.chunks);
  const currentChunkIndex = useAppStore((s) => s.currentChunkIndex);
  const setCurrentChunk = useAppStore((s) => s.setCurrentChunk);
  const audioUrl = useAppStore((s) => s.audioUrl);
  const storeSetCurrentTime = useAppStore((s) => s.setCurrentTime);

  const currentChunk = chunks[currentChunkIndex];

  // Initialize WaveSurfer
  useEffect(() => {
    let destroyed = false;
    let ws: any;

    async function init() {
      if (!waveformRef.current) return;
      
      const { WaveSurfer: WS, RegionsPlugin: RP, HoverPlugin: HP, TimelinePlugin: TP } = await loadWavesurfer();
      if (destroyed) return;

      // Create plugins
      const regions = RP.create({
        drag: false,
        resize: false,
      });
      regionsRef.current = regions;

      const hover = HP.create({
        lineColor: '#8b5cf6',
        lineWidth: 2,
        labelBackground: '#8b5cf6',
        labelColor: '#fff',
        labelSize: '11px',
      });

      const timeline = TP.create({
        container: timelineRef.current || undefined,
        primaryLabelInterval: 10,
        secondaryLabelInterval: 2,
        timeInterval: 1,
        primaryLabelColor: '#6b7280',
        secondaryLabelColor: '#9ca3af',
        primaryFontSize: 12,
        secondaryFontSize: 10,
      });

      ws = WS.create({
        container: waveformRef.current,
        waveColor: '#c4b5fd',
        progressColor: '#8b5cf6',
        cursorColor: '#7c3aed',
        cursorWidth: 2,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 80,
        normalize: true,
        plugins: [regions, hover, timeline],
        backend: 'WebAudio',
      });

      wavesurferRef.current = ws;

      // Event listeners
      ws.on('ready', () => {
        setIsReady(true);
        setDuration(ws.getDuration());
        ws.setVolume(volume);
      });

      ws.on('audioprocess', (time: number) => {
        setLocalCurrentTime(time);
        storeSetCurrentTime(time);
      });

      ws.on('timeupdate', (time: number) => {
        setLocalCurrentTime(time);
        storeSetCurrentTime(time);
      });

      ws.on('play', () => setPlaying(true));
      ws.on('pause', () => setPlaying(false));
      ws.on('finish', () => {
        if (loop) {
          ws.play(0);
        } else {
          setPlaying(false);
          // Auto-advance to next chunk
          if (currentChunkIndex < chunks.length - 1) {
            setCurrentChunk(currentChunkIndex + 1);
          }
        }
      });

      ws.on('error', (err: any) => {
        console.error('WaveSurfer error:', err);
        setIsReady(false);
      });

      // Load audio if URL exists
      if (audioUrl) {
        ws.load(audioUrl);
      }
    }

    init();

    return () => {
      destroyed = true;
      if (ws) {
        ws.destroy();
      }
      wavesurferRef.current = null;
      regionsRef.current = null;
    };
  }, []);

  // Load new audio when URL changes
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws || !audioUrl) return;
    
    setIsReady(false);
    ws.load(audioUrl);
  }, [audioUrl]);

  // Update regions when chunks change
  useEffect(() => {
    const regions = regionsRef.current;
    const ws = wavesurferRef.current;
    if (!regions || !ws || !duration) return;

    regions.clearRegions();
    
    if (chunks.length > 0 && duration > 0) {
      // Calculate positions based on chunk durations or evenly distribute
      let currentTime = 0;
      chunks.forEach((chunk, index) => {
        const chunkDuration = chunk.duration || (duration / chunks.length);
        const start = currentTime;
        const end = Math.min(currentTime + chunkDuration, duration);
        
        regions.addRegion({
          start,
          end,
          color: index === currentChunkIndex ? 'rgba(139, 92, 246, 0.3)' : 'rgba(156, 163, 175, 0.15)',
          borderColor: index === currentChunkIndex ? '#8b5cf6' : 'transparent',
          borderWidth: 2,
          content: `${index + 1}`,
          contentEditable: false,
          drag: false,
          resize: false,
        });
        
        currentTime = end;
      });
    }
  }, [chunks, duration, currentChunkIndex]);

  // Sync play/pause state
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws || !isReady) return;
    
    if (isPlaying && !ws.isPlaying()) {
      ws.play();
    } else if (!isPlaying && ws.isPlaying()) {
      ws.pause();
    }
  }, [isPlaying, isReady]);

  // Handle volume changes
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    ws.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  const togglePlay = useCallback(() => {
    const ws = wavesurferRef.current;
    if (!ws || !isReady) return;
    
    if (ws.isPlaying()) {
      ws.pause();
    } else {
      ws.play();
    }
  }, [isReady]);

  const prevChunk = useCallback(() => {
    if (currentChunkIndex > 0) {
      const newIndex = currentChunkIndex - 1;
      setCurrentChunk(newIndex);
      // Seek to chunk start
      const ws = wavesurferRef.current;
      if (ws && duration > 0) {
        const chunkDuration = chunks[newIndex]?.duration || (duration / chunks.length);
        const seekTime = newIndex * chunkDuration;
        ws.seekTo(seekTime / duration);
      }
    }
  }, [currentChunkIndex, chunks, duration, setCurrentChunk]);

  const nextChunk = useCallback(() => {
    if (currentChunkIndex < chunks.length - 1) {
      const newIndex = currentChunkIndex + 1;
      setCurrentChunk(newIndex);
      // Seek to chunk start
      const ws = wavesurferRef.current;
      if (ws && duration > 0) {
        const chunkDuration = chunks[newIndex]?.duration || (duration / chunks.length);
        const seekTime = newIndex * chunkDuration;
        ws.seekTo(seekTime / duration);
      }
    }
  }, [currentChunkIndex, chunks, duration, setCurrentChunk]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const ws = wavesurferRef.current;
    if (!ws || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    ws.seekTo(progress);
    
    // Update current chunk based on seek position
    if (chunks.length > 0) {
      const chunkDuration = duration / chunks.length;
      const newIndex = Math.min(Math.floor((progress * duration) / chunkDuration), chunks.length - 1);
      setCurrentChunk(newIndex);
    }
  }, [duration, chunks, setCurrentChunk]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Chunk Timeline */}
      {chunks.length > 0 && (
        <ChunkTimeline 
          chunks={chunks} 
          currentIndex={currentChunkIndex}
          duration={duration}
          onChunkClick={(index) => {
            setCurrentChunk(index);
            const ws = wavesurferRef.current;
            if (ws && duration > 0) {
              const chunkDuration = chunks[index]?.duration || (duration / chunks.length);
              const seekTime = index * chunkDuration;
              ws.seekTo(seekTime / duration);
            }
          }}
        />
      )}

      {/* Main Player */}
      <div className="flex items-center gap-4">
        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={prevChunk}
            disabled={currentChunkIndex <= 0}
            className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-30 text-surface-700 transition-colors"
            title="Предыдущий сегмент"
          >
            <SkipBack size={18} />
          </button>
          
          <button
            onClick={togglePlay}
            disabled={!isReady}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          
          <button
            onClick={nextChunk}
            disabled={currentChunkIndex >= chunks.length - 1}
            className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-30 text-surface-700 transition-colors"
            title="Следующий сегмент"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Waveform */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-surface-500">
            <span>{formatTime(localCurrentTime)}</span>
            <span className="truncate px-2">
              {currentChunk ? currentChunk.text.slice(0, 80) + (currentChunk.text.length > 80 ? '...' : '') : 'Нет аудио'}
            </span>
            <span>{formatTime(duration)}</span>
          </div>
          
          <div 
            ref={waveformRef}
            onClick={handleSeek}
            className="h-20 bg-surface-100 rounded-lg w-full cursor-pointer relative overflow-hidden"
          >
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-surface-400">
                {audioUrl ? 'Загрузка аудио...' : 'Нет аудио для воспроизведения'}
              </div>
            )}
          </div>
          
          {/* Timeline axis */}
          <div ref={timelineRef} className="h-5" />
        </div>

        {/* Volume & Options */}
        <div className="flex flex-col gap-2 w-32 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 rounded hover:bg-surface-100 text-surface-500 transition-colors"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="w-full h-1.5 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLoop(!loop)}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${loop ? 'bg-primary-100 text-primary-700' : 'hover:bg-surface-100 text-surface-500'}`}
              title="Повтор"
            >
              <Repeat size={14} />
              <span>Повтор</span>
            </button>
            
            <button
              onClick={() => {
                const ws = wavesurferRef.current;
                if (ws) ws.seekTo(0);
                setCurrentChunk(0);
              }}
              className="p-1.5 rounded hover:bg-surface-100 text-surface-500 transition-colors"
              title="В начало"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Chunk Info */}
      {chunks.length > 0 && (
        <div className="flex items-center justify-between text-xs text-surface-500 px-1">
          <span>Сегмент {currentChunkIndex + 1} из {chunks.length}</span>
          <span>{chunks.filter(c => c.status === 'completed').length} из {chunks.length} синтезировано</span>
        </div>
      )}
    </div>
  );
}

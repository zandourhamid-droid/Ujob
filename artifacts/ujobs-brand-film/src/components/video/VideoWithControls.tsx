import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Pause, Play, Repeat } from 'lucide-react';
import VideoTemplate, { SCENE_DURATIONS } from './VideoTemplate';
import { useSceneControls } from './useSceneControls';

const SCENE_DETAILS: Record<string, { title: string; filePath: string }> = {
  intro: { title: 'الحاجة اليومية', filePath: 'src/components/video/video_scenes/IntroScene.tsx' },
  network: { title: 'شبكة المهنيين', filePath: 'src/components/video/video_scenes/NetworkScene.tsx' },
  request: { title: 'رحلة الطلب', filePath: 'src/components/video/video_scenes/RequestScene.tsx' },
  trust: { title: 'الوضوح والثقة', filePath: 'src/components/video/video_scenes/TrustScene.tsx' },
  finale: { title: 'خاتمة Ujobs', filePath: 'src/components/video/video_scenes/FinaleScene.tsx' },
};

function formatTime(durationMs: number) {
  const seconds = Math.max(0, Math.floor(durationMs / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function PlaybackStatus({
  sceneKeys,
  activeIndex,
  activeDuration,
  activeStartTime,
  totalDuration,
  paused,
  tick,
  onJump,
}: {
  sceneKeys: string[];
  activeIndex: number;
  activeDuration: number;
  activeStartTime: number;
  totalDuration: number;
  paused: boolean;
  tick: number;
  onJump: (index: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const baseRef = useRef(0);

  useEffect(() => {
    baseRef.current = 0;
    setElapsed(0);
  }, [tick]);

  useEffect(() => {
    if (paused) return;
    const startedAt = performance.now();
    const timer = window.setInterval(() => setElapsed(baseRef.current + performance.now() - startedAt), 60);
    return () => {
      window.clearInterval(timer);
      baseRef.current += performance.now() - startedAt;
    };
  }, [paused, tick]);

  const progress = activeDuration ? Math.min(1, elapsed / activeDuration) : 0;
  const totalElapsed = Math.min(totalDuration, activeStartTime + Math.min(elapsed, activeDuration));

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {sceneKeys.map((key, index) => (
          <button key={key} type="button" onClick={() => onJump(index)} aria-label={`انتقل إلى المشهد ${index + 1}`} className="relative h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/20">
            <span className="absolute inset-y-0 right-0 rounded-full bg-[#61e2ea]" style={{ width: `${index === activeIndex ? progress * 100 : index < activeIndex ? 100 : 0}%` }} />
          </button>
        ))}
      </div>
      <span className="shrink-0 font-mono text-xs text-white/70">{activeIndex + 1}/{sceneKeys.length}</span>
      <span className="shrink-0 font-mono text-xs text-white/80">{formatTime(totalElapsed)} / {formatTime(totalDuration)}</span>
    </>
  );
}

export default function VideoWithControls() {
  const isIframed = typeof window !== 'undefined' && window.self !== window.top;
  const controls = useSceneControls(SCENE_DURATIONS);
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const sensorRef = useRef<HTMLDivElement | null>(null);
  const barVisible = !collapsed || hovering;

  const announceScene = useCallback((index: number) => {
    const key = controls.sceneKeys[index];
    const detail = SCENE_DETAILS[key];
    if (!detail || typeof window === 'undefined') return;
    window.parent.postMessage({ type: 'REPLIT_VIDEO_SCENE_SELECTED', payload: { sceneIndex: index, sceneCount: controls.sceneKeys.length, sceneTitle: detail.title, filePath: detail.filePath, lineNumber: 1 } }, '*');
  }, [controls.sceneKeys]);

  useEffect(() => {
    if (!controls.paused || typeof document === 'undefined') return;
    const running = document.getAnimations().filter((animation) => animation.playState === 'running');
    running.forEach((animation) => animation.pause());
    return () => running.forEach((animation) => animation.play());
  }, [controls.paused]);

  if (!isIframed) return <VideoTemplate />;

  return (
    <div className="relative h-screen w-full bg-[#0c3456]">
      <VideoTemplate key={controls.mountKey} durations={controls.durations} paused={controls.paused} onSceneChange={controls.onSceneChange} />
      <div ref={sensorRef} className="absolute inset-x-0 bottom-0 z-50 flex h-1/4 flex-col justify-end" onPointerEnter={(event) => event.pointerType === 'mouse' && setHovering(true)} onPointerLeave={(event) => event.pointerType === 'mouse' && setHovering(false)}>
        <div className={`flex items-center gap-2 bg-black/55 px-3 py-3 backdrop-blur-md transition-all duration-200 ${barVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'}`}>
          <button type="button" onClick={controls.togglePause} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white/75 hover:bg-white/10 hover:text-white" aria-label={controls.paused ? 'تشغيل' : 'إيقاف مؤقت'}>{controls.paused ? <Play className="size-5" /> : <Pause className="size-5" />}</button>
          <button type="button" onClick={controls.toggleLock} className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${controls.locked ? 'bg-white/15 text-white' : 'text-white/65 hover:bg-white/10 hover:text-white'}`} aria-label="تكرار المشهد الحالي" aria-pressed={controls.locked}><Repeat className="size-5" /></button>
          <PlaybackStatus sceneKeys={controls.sceneKeys} activeIndex={controls.activeIndex} activeDuration={controls.activeDuration} activeStartTime={controls.activeStartTime} totalDuration={controls.totalDuration} paused={controls.paused} tick={controls.tick} onJump={(index) => { controls.jumpTo(index); announceScene(index); }} />
          <button type="button" onClick={() => setCollapsed((value) => !value)} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white/65 hover:bg-white/10 hover:text-white" aria-label={collapsed ? 'إظهار الأدوات' : 'إخفاء الأدوات'}>{collapsed ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}</button>
        </div>
      </div>
    </div>
  );
}
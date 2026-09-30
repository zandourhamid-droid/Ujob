import {
  VideoCanvas,
  type VideoAspectRatio,
  VideoPausedContext,
  useVideoPlayer,
} from '@/lib/video';
import { AnimatePresence } from 'framer-motion';
import { useEffect, type ComponentType } from 'react';

import { IntroScene } from './video_scenes/IntroScene';
import { NetworkScene } from './video_scenes/NetworkScene';
import { RequestScene } from './video_scenes/RequestScene';
import { TrustScene } from './video_scenes/TrustScene';
import { FinaleScene } from './video_scenes/FinaleScene';

export const SCENE_DURATIONS = {
  intro: 4800,
  network: 4800,
  request: 4800,
  trust: 4800,
  finale: 4800,
};

const VIDEO_ASPECT_RATIO: VideoAspectRatio = '9:16';

const SCENE_COMPONENTS: Record<string, ComponentType> = {
  intro: IntroScene,
  network: NetworkScene,
  request: RequestScene,
  trust: TrustScene,
  finale: FinaleScene,
};

type VideoTemplateProps = {
  durations?: Record<string, number>;
  loop?: boolean;
  paused?: boolean;
  onSceneChange?: (sceneKey: string) => void;
};

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  paused = false,
  onSceneChange,
}: VideoTemplateProps = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop, paused });
  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  return (
    <VideoPausedContext.Provider value={paused}>
      <VideoCanvas aspectRatio={VIDEO_ASPECT_RATIO} style={{ backgroundColor: '#0c3456' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="film-grain absolute inset-0 opacity-20" />
          <AnimatePresence mode="sync" initial={false}>
            {SceneComponent && <SceneComponent key={currentSceneKey} />}
          </AnimatePresence>
        </div>
      </VideoCanvas>
    </VideoPausedContext.Provider>
  );
}

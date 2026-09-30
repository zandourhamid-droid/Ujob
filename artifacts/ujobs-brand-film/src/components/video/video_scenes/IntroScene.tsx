import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';

const EASE = [0.16, 1, 0.3, 1] as const;

export function IntroScene() {
  const [beat, setBeat] = useState(0);
  useSceneTimer([
    { time: 620, callback: () => setBeat(1) },
    { time: 1260, callback: () => setBeat(2) },
    { time: 1940, callback: () => setBeat(3) },
  ]);

  return (
    <motion.section
      className="absolute inset-0 overflow-hidden bg-[#0c3456] text-white"
      initial={{ opacity: 0, scale: 1.06 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.12, filter: 'blur(12px)' }}
      transition={{ duration: 0.65, ease: EASE }}
    >
      <motion.div
        className="absolute -left-[22vmin] top-[10vmin] size-[72vmin] rounded-full border border-[#61e2ea]/20"
        animate={{ rotate: [0, 18], scale: [0.96, 1.06] }}
        transition={{ duration: 4.5, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[10%] top-[9%] size-3 rounded-full bg-[#61e2ea] shadow-[0_0_28px_#61e2ea]"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: [0, 46, 180], x: [0, -12, -12], opacity: [1, 1, 0.7] }}
        transition={{ duration: 4.1, ease: EASE }}
      />
      <motion.svg className="absolute inset-0 size-full" viewBox="0 0 100 178" preserveAspectRatio="none" aria-hidden="true">
        <motion.path d="M 84 15 C 88 40, 76 55, 56 68 S 42 91, 50 114" fill="none" stroke="#61e2ea" strokeWidth=".35" strokeDasharray="2 2" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: .75 }} transition={{ duration: 1.2, delay: .45, ease: EASE }} />
      </motion.svg>

      <div className="absolute inset-x-[8%] top-[12%]">
        <motion.p className="text-[2.6vmin] font-bold tracking-[.14em] text-[#b9eff5]" initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25, duration: .55, ease: EASE }}>
          UJOBS / 01
        </motion.p>
        <motion.h1 className="mt-[4vmin] text-[11vmin] font-extrabold leading-[1.08] tracking-[-.06em]" initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .45, duration: .75, ease: EASE }}>
          تحتاج لخدمة كيف ما كانت؟
          <br />
          <span className="text-[#61e2ea]">ابدأ من هنا.</span>
        </motion.h1>
        {beat >= 1 && <motion.p className="mt-[3vmin] text-[5.5vmin] font-bold leading-tight text-blue-100" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .5, ease: EASE }}>أقرب مما تتوقع.</motion.p>}
      </div>

      <motion.div
        className="absolute inset-x-[8%] bottom-[9%] rounded-[6vmin] border border-white/15 bg-white/[.09] p-[1.5vmin] shadow-2xl backdrop-blur-md"
        initial={{ y: 90, scale: .86, opacity: 0 }}
        animate={{ y: 0, scale: beat >= 2 ? [1, 1.025, 1] : 1, opacity: 1 }}
        transition={{ delay: .8, duration: .75, ease: EASE }}
      >
        <div className="rounded-[4.8vmin] bg-[#f8f4eb] p-[5vmin] text-[#0c3456]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[2.5vmin] font-bold tracking-[.14em] text-[#188a9b]">خدمة محلية بثقة</p>
              <p className="mt-[2vmin] text-[5.2vmin] font-extrabold leading-tight">ما الذي تحتاجه؟</p>
            </div>
            <span className="flex size-[11vmin] items-center justify-center rounded-[3vmin] bg-[#dceef0] text-[6vmin] font-extrabold text-[#188a9b]">+</span>
          </div>
          <div className="mt-[5vmin] space-y-[2vmin]">
            {['الخدمة', 'المدينة', 'الوقت'].map((label, index) => (
              <motion.div key={label} className="flex items-center justify-between rounded-[2.5vmin] bg-[#edf5f3] px-[3vmin] py-[2.3vmin] text-[3.1vmin] font-bold text-[#416277]" initial={{ opacity: 0, x: 22 }} animate={{ opacity: beat >= 3 || index < beat ? 1 : .35, x: 0 }} transition={{ delay: .15 * index, duration: .4 }}>
                {label}<span className="size-[2vmin] rounded-full bg-[#61e2ea]" />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
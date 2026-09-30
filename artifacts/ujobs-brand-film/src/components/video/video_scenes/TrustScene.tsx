import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';

export function TrustScene() {
  const [beat, setBeat] = useState(0);
  useSceneTimer([
    { time: 680, callback: () => setBeat(1) },
    { time: 1580, callback: () => setBeat(2) },
    { time: 2720, callback: () => setBeat(3) },
  ]);

  return (
    <motion.section
      className="absolute inset-0 overflow-hidden bg-[#f8f4eb] text-[#0c3456]"
      initial={{ clipPath: 'circle(0% at 50% 76%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
      transition={{ duration: .8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-x-[8%] top-[12%]">
        <p className="text-[2.5vmin] font-extrabold tracking-[.12em] text-[#188a9b]">وضوح من البداية / 04</p>
        <motion.h2 className="mt-[4vmin] text-[10vmin] font-extrabold leading-[1.08] tracking-[-.06em]" initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .4, duration: .6 }}>واضح<br /><span className="text-[#188a9b]">وعادل.</span></motion.h2>
      </div>
      <motion.div className="absolute left-1/2 top-[52%] flex size-[56vmin] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[1.5vmin] border-[#61e2ea] bg-[#dceef0] shadow-[0_2vmin_7vmin_rgba(12,52,86,.12)]" initial={{ scale: .7, opacity: 0 }} animate={{ scale: beat >= 1 ? [0.7, 1.04, 1] : .7, opacity: beat >= 1 ? 1 : 0 }} transition={{ duration: .75, ease: [0.16, 1, 0.3, 1] }}>
        <div className="text-center">
          <motion.p className="text-[3.2vmin] font-extrabold text-[#188a9b]" initial={{ opacity: 0 }} animate={{ opacity: beat >= 2 ? 1 : 0 }}>العمولة</motion.p>
          <motion.p className="mt-[1vmin] text-[14vmin] font-extrabold leading-none tracking-[-.08em]" initial={{ scale: .7, opacity: 0 }} animate={{ scale: beat >= 2 ? [0.7, 1.05, 1] : .7, opacity: beat >= 2 ? 1 : 0 }} transition={{ duration: .65 }}>10 <span className="text-[7vmin]">د.م</span></motion.p>
          <motion.p className="mt-[2vmin] text-[3.3vmin] font-bold text-[#416277]" initial={{ y: 10, opacity: 0 }} animate={{ y: beat >= 2 ? 0 : 10, opacity: beat >= 2 ? 1 : 0 }}>عند قبول الطلب المؤهل</motion.p>
        </div>
      </motion.div>
      <div className="absolute inset-x-[8%] bottom-[9%] flex items-center justify-between">
        <motion.div className="flex items-center gap-[2vmin] text-[3.3vmin] font-extrabold text-[#416277]" initial={{ x: -25, opacity: 0 }} animate={{ x: beat >= 3 ? 0 : -25, opacity: beat >= 3 ? 1 : 0 }}><span className="flex size-[7vmin] items-center justify-center rounded-full bg-[#0c3456] text-[3.5vmin] text-[#61e2ea]">✓</span> دعم محلي</motion.div>
        <motion.div className="flex items-center gap-[2vmin] text-[3.3vmin] font-extrabold text-[#416277]" initial={{ x: 25, opacity: 0 }} animate={{ x: beat >= 3 ? 0 : 25, opacity: beat >= 3 ? 1 : 0 }}><span className="flex size-[7vmin] items-center justify-center rounded-full bg-[#f5b94c] text-[3.5vmin] text-[#0c3456]">✓</span> عروض واضحة</motion.div>
      </div>
      {beat >= 3 && <motion.div className="absolute left-1/2 top-[52%] size-[4vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0c3456]" initial={{ scale: 1 }} animate={{ scale: 16, opacity: [1, 1, 0] }} transition={{ delay: .65, duration: 1.1, ease: [0.16, 1, 0.3, 1] }} />}
    </motion.section>
  );
}
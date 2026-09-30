import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';

const nodes = [
  { x: '22%', y: '42%', label: 'كهرباء', color: '#f5b94c' },
  { x: '76%', y: '34%', label: 'تنظيف', color: '#61e2ea' },
  { x: '66%', y: '75%', label: 'تصميم', color: '#f5b94c' },
];

export function NetworkScene() {
  const [beat, setBeat] = useState(0);
  useSceneTimer([
    { time: 560, callback: () => setBeat(1) },
    { time: 1420, callback: () => setBeat(2) },
    { time: 2520, callback: () => setBeat(3) },
  ]);

  return (
    <motion.section
      className="absolute inset-0 overflow-hidden bg-[#dceef0] text-[#0c3456]"
      initial={{ clipPath: 'circle(0% at 84% 15%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ scale: 1.12, opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: .8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute -right-[16vmin] -top-[12vmin] size-[72vmin] rounded-full border-[1.5vmin] border-[#61e2ea]/30" />
      <div className="absolute inset-x-[8%] top-[12%]">
        <motion.p className="text-[2.5vmin] font-extrabold tracking-[.12em] text-[#188a9b]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .35 }}>شبكة UJOBS / 02</motion.p>
        <motion.h2 className="mt-[4vmin] max-w-[82%] text-[9.5vmin] font-extrabold leading-[1.12] tracking-[-.05em]" initial={{ y: -35, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .55, duration: .65 }}>
          الأقرب
          <br />
          <span className="text-[#188a9b]">إليك.</span>
        </motion.h2>
        {beat >= 1 && <motion.p className="mt-[3vmin] text-[4vmin] font-bold text-[#416277]" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>مهنيون موثّقون في مدينتك</motion.p>}
      </div>

      <div className="absolute inset-x-[8%] bottom-[10%] top-[46%]">
        <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {nodes.map((node, index) => (
            <motion.line key={node.label} x1="50" y1="50" x2={Number.parseFloat(node.x)} y2={Number.parseFloat(node.y) - 46} stroke="#188a9b" strokeWidth=".45" strokeDasharray="3 2" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: beat > index ? 1 : 0, opacity: beat > index ? .7 : 0 }} transition={{ duration: .65, delay: index * .14 }} />
          ))}
        </svg>
        <motion.div className="absolute left-1/2 top-1/2 flex size-[19vmin] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#0c3456] text-[10vmin] font-extrabold text-[#61e2ea] shadow-[0_1vmin_3vmin_rgba(12,52,86,.25)]" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>U</motion.div>
        {nodes.map((node, index) => (
          <motion.div key={node.label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: node.x, top: node.y }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: beat > index ? [0, 1.14, 1] : 0, opacity: beat > index ? 1 : 0 }} transition={{ type: 'spring', stiffness: 340, damping: 20 }}>
            <div className="flex items-center gap-[2vmin] rounded-full border border-white/80 bg-white px-[3vmin] py-[2vmin] shadow-lg">
              <span className="size-[3.2vmin] rounded-full" style={{ backgroundColor: node.color }} />
              <span className="text-[3.1vmin] font-extrabold">{node.label}</span>
            </div>
          </motion.div>
        ))}
        {beat >= 3 && <motion.div className="absolute bottom-[4%] left-[51%] flex size-[10vmin] -translate-x-1/2 items-center justify-center rounded-[3vmin] bg-[#f5b94c] text-[6vmin] text-[#0c3456] shadow-xl" initial={{ y: 28, opacity: 0, scale: .6 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ duration: .5 }}>⌖</motion.div>}
      </div>
    </motion.section>
  );
}
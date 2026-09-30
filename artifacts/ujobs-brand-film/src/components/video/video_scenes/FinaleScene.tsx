import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';

const words = ['أطلب', 'قارن', 'أنجز'];

export function FinaleScene() {
  const [beat, setBeat] = useState(0);
  useSceneTimer([
    { time: 480, callback: () => setBeat(1) },
    { time: 980, callback: () => setBeat(2) },
    { time: 1480, callback: () => setBeat(3) },
    { time: 2550, callback: () => setBeat(4) },
  ]);

  return (
    <motion.section
      className="absolute inset-0 overflow-hidden bg-[#0c3456] text-white"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: .65, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div className="absolute left-1/2 top-[38%] size-[65vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#61e2ea]/20" initial={{ scale: .55, opacity: 0 }} animate={{ scale: [0.55, 1.02, 1], opacity: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
      <motion.div className="absolute left-[17%] top-[19%] size-[3vmin] rounded-full bg-[#61e2ea] shadow-[0_0_25px_#61e2ea]" animate={{ x: [0, 16, 0], y: [0, 12, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
      <div className="absolute inset-x-[8%] top-[13%]">
        <p className="text-[2.5vmin] font-extrabold tracking-[.14em] text-[#b9eff5]">UJOBS / 05</p>
        <div className="mt-[7vmin] space-y-[1vmin] text-center">
          {words.map((word, index) => (
            <motion.p key={word} className={`text-[13vmin] font-extrabold leading-[.95] tracking-[-.08em] ${index === 1 ? 'text-[#61e2ea]' : 'text-white'}`} initial={{ opacity: 0, y: 65, rotate: index % 2 ? 4 : -4 }} animate={{ opacity: beat > index ? 1 : 0, y: beat > index ? 0 : 65, rotate: beat > index ? 0 : index % 2 ? 4 : -4 }} transition={{ type: 'spring', stiffness: 380, damping: 25, delay: index * .04 }}>{word}</motion.p>
          ))}
        </div>
      </div>
      <motion.div className="absolute inset-x-[8%] bottom-[12%] text-center" initial={{ opacity: 0, y: 30 }} animate={{ opacity: beat >= 4 ? 1 : 0, y: beat >= 4 ? 0 : 30 }} transition={{ duration: .7, ease: [0.16, 1, 0.3, 1] }}>
        <div className="flex items-center justify-center gap-[3vmin]">
          <span className="flex size-[14vmin] items-center justify-center rounded-[4vmin] bg-[#61e2ea] text-[11vmin] font-extrabold leading-none text-[#0c3456]">U</span>
          <span className="font-['Manrope'] text-[12vmin] font-extrabold tracking-[-.1em]">jobs</span>
        </div>
        <p className="mt-[3vmin] text-[4.2vmin] font-bold text-blue-100">خدمات محلية بثقة</p>
        <div className="mx-auto mt-[4vmin] flex justify-center gap-[1.5vmin]"><span className="size-[1.8vmin] rounded-full bg-[#61e2ea]" /><span className="size-[1.8vmin] rounded-full bg-[#f5b94c]" /><span className="size-[1.8vmin] rounded-full bg-white/60" /></div>
      </motion.div>
    </motion.section>
  );
}
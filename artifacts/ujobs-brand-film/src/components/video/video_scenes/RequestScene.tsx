import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';

const words = ['اطلب.', 'قارن.', 'اختر.'];
const labels = ['تفاصيل واضحة', 'عروض متعددة', 'اختيارك'];

export function RequestScene() {
  const [beat, setBeat] = useState(0);
  useSceneTimer([
    { time: 520, callback: () => setBeat(1) },
    { time: 1420, callback: () => setBeat(2) },
    { time: 2360, callback: () => setBeat(3) },
  ]);

  return (
    <motion.section
      className="absolute inset-0 overflow-hidden bg-[#10365a] text-white"
      initial={{ opacity: 0, scale: .88, filter: 'blur(9px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.14, filter: 'blur(11px)' }}
      transition={{ duration: .75, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div className="absolute -left-[20vmin] top-[8%] size-[70vmin] rounded-full border border-[#61e2ea]/15" animate={{ rotate: 360 }} transition={{ duration: 16, repeat: Infinity, ease: 'linear' }} />
      <div className="absolute inset-x-[8%] top-[11%]">
        <p className="text-[2.5vmin] font-extrabold tracking-[.12em] text-[#b9eff5]">رحلة الطلب / 03</p>
        <div className="relative mt-[4vmin] h-[15vmin] overflow-hidden">
          <AnimatePresence mode="sync" initial={false}>
            <motion.h2 key={words[beat]} className="absolute right-0 text-[12vmin] font-extrabold leading-none tracking-[-.07em] text-[#61e2ea]" initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ duration: .42, ease: [0.16, 1, 0.3, 1] }}>{words[beat]}</motion.h2>
          </AnimatePresence>
        </div>
      </div>

      <motion.div className="absolute inset-x-[10%] bottom-[9%] top-[38%] rounded-[7vmin] border border-white/15 bg-white/[.08] p-[1.5vmin] shadow-2xl backdrop-blur-md" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .35, duration: .75 }}>
        <div className="relative h-full overflow-hidden rounded-[5.5vmin] bg-[#f8f4eb] p-[5vmin] text-[#0c3456]">
          <div className="flex items-center justify-between">
            <div><p className="text-[2.4vmin] font-extrabold tracking-[.1em] text-[#188a9b]">طلب جديد</p><p className="mt-[1vmin] text-[4.5vmin] font-extrabold">إصلاح كهرباء</p></div>
            <span className="flex size-[10vmin] items-center justify-center rounded-full bg-[#dceef0] text-[5vmin] text-[#188a9b]">⌁</span>
          </div>
          <div className="mt-[7vmin] space-y-[3vmin]">
            {labels.map((label, index) => (
              <motion.div key={label} className={`flex items-center gap-[3vmin] rounded-[3vmin] border p-[3vmin] ${index === beat - 1 ? 'border-[#61e2ea] bg-[#edf5f3]' : 'border-[#dceef0] bg-white/70'}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: beat > index ? 1 : .26, x: beat > index ? 0 : 20 }} transition={{ delay: .14 * index, duration: .45 }}>
                <span className={`flex size-[7vmin] items-center justify-center rounded-2xl text-[3.4vmin] font-extrabold ${index === beat - 1 ? 'bg-[#61e2ea] text-[#0c3456]' : 'bg-[#dceef0] text-[#188a9b]'}`}>0{index + 1}</span>
                <span className="text-[3.2vmin] font-extrabold">{label}</span>
                <span className="mr-auto text-[3.5vmin] font-extrabold text-[#188a9b]">{index < beat - 1 ? '✓' : index === beat - 1 ? '•' : '—'}</span>
              </motion.div>
            ))}
          </div>
          {beat >= 3 && <motion.div className="absolute bottom-[7%] left-1/2 flex size-[23vmin] -translate-x-1/2 items-center justify-center rounded-full border-[1.4vmin] border-[#61e2ea] bg-[#0c3456] text-[12vmin] text-[#61e2ea] shadow-xl" initial={{ scale: .35, rotate: -35, opacity: 0 }} animate={{ scale: [0.35, 1.08, 1], rotate: 0, opacity: 1 }} transition={{ duration: .75, ease: [0.16, 1, 0.3, 1] }}>✓</motion.div>}
        </div>
      </motion.div>
    </motion.section>
  );
}
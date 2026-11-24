"use client";

import { useEffect, useRef, useState } from "react";

// Bridge Solver sayfasının doğal boyutu (piksel). Kutu daha darsa sayfa
// orantılı küçültülür; böylece kaydırma çubuğu olmadan tek ekranda görünür.
const NATURAL_W = 816; // sayfa 800 px + kenar boşlukları
const NATURAL_H = 476; // alttaki düğme satırı dahil

export default function SolverFrame({ src, title }: { src: string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / NATURAL_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className="solver-box" style={{ height: Math.ceil(NATURAL_H * scale) }}>
      <iframe
        src={src}
        title={title}
        scrolling="no"
        style={{
          width: NATURAL_W,
          height: NATURAL_H,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
        }}
      />
    </div>
  );
}

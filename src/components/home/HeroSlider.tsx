'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function HeroSlider({ slides }: { slides: { image: string }[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI(x => (x + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, [slides.length]);
  return (
    <>
      {slides.map((s, n) => (
        <Image key={s.image} src={s.image} alt="" fill priority={n === 0} sizes="100vw"
          className={`-z-20 object-cover transition-opacity duration-[1500ms] ${n === i ? 'opacity-100 kenburns' : 'opacity-0'}`} />
      ))}
    </>
  );
}

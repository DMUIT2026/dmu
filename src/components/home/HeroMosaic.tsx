import Image from 'next/image';

/** Three photos shown as framed cards at close to their real size, so they stay sharp. */
export default function HeroMosaic({ images }: { images: string[] }) {
  const [a, b, c] = images;
  if (!a) return null;
  return (
    <>
    <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] ring-1 ring-white/10 lg:hidden">
      <Image src={a} alt="" fill priority sizes="100vw" quality={85} className="object-cover" />
    </div>
    <div className="rise rise-3 relative hidden aspect-[5/4] lg:block">
      <div className="absolute right-0 top-0 h-[62%] w-[78%] overflow-hidden rounded-[1.75rem] shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)] ring-1 ring-white/10">
        <Image src={a} alt="" fill priority sizes="560px" quality={90} className="object-cover" />
      </div>
      {b && (
        <div className="absolute bottom-0 left-0 h-[46%] w-[56%] overflow-hidden rounded-[1.5rem] shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)] ring-1 ring-white/10">
          <Image src={b} alt="" fill sizes="400px" quality={90} className="object-cover" />
        </div>
      )}
      {c && (
        <div className="absolute bottom-[6%] right-[4%] h-[30%] w-[38%] overflow-hidden rounded-[1.25rem] shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)] ring-4 ring-espresso">
          <Image src={c} alt="" fill sizes="280px" quality={90} className="object-cover" />
        </div>
      )}
      <div aria-hidden className="absolute -left-4 top-[30%] size-24 rounded-full border border-gold-400/40" />
    </div>
    </>
  );
}

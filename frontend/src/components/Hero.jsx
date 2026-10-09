import { GraduationCap, MapPin, Search, CirclePlus } from 'lucide-react';
export default function Hero({ onPost, children }) {
  return (
    <section className="relative my-6 overflow-hidden rounded-3xl bg-brand-dark">
      <img src="/hero.jpg" alt="Kilele Tuition Block on the KYU campus" className="absolute inset-0 size-full object-cover object-[50%_30%] brightness-110 saturate-110 contrast-105" />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/70 via-brand-dark/45 to-brand-dark/20 lg:bg-gradient-to-r lg:from-brand-dark/80 lg:via-brand-dark/35 lg:to-transparent" aria-hidden="true" />
      <div className={`relative grid gap-8 p-5 sm:p-10 lg:p-14 lg:items-center ${children ? 'lg:grid-cols-[1fr_380px]' : ''}`}>
        <div className="py-4 [text-shadow:0_2px_14px_rgb(0_0_0/0.5)]">
          <p className="flex flex-wrap gap-2 text-sm font-semibold text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1"><GraduationCap className="size-4" />Students Support Students</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1"><MapPin className="size-4" />Kutus, Kirinyaga</span>
          </p>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">Buy &amp; Sell Anything Within Your Campus</h1>
          <p className="mt-2 text-lg font-semibold text-emerald-200 sm:text-xl">Your Campus Marketplace</p>
          <p className="mt-4 max-w-xl text-base text-white/90 sm:text-lg">KYU Mart is a student marketplace where you can buy and sell items easily, safely and at affordable prices.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="#listings" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-brand-dark hover:bg-brand-tint"><Search className="size-5" />Browse Listings</a>
            <button onClick={onPost} className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white px-6 py-3 font-semibold text-white hover:bg-white hover:text-brand-dark"><CirclePlus className="size-5" />Post Your Ad</button>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

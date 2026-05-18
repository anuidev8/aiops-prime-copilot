interface PrimeNarrativeProps {
  narrative: string;
  businessSummary: string;
}

export function PrimeNarrative({ narrative, businessSummary }: PrimeNarrativeProps) {
  return (
    <div className="space-y-4">
      <article className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 text-sm text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
          Operations Narrative
        </p>
        <p className="mt-3 leading-relaxed text-slate-400">{narrative}</p>
      </article>
      
      <article className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-slate-900 via-[#0a192f] to-[#0d2138] p-4 text-sm text-blue-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_20px_rgba(59,130,246,0.1)] relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-400/80 flex items-center gap-2 relative z-10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          Business Summary
        </p>
        <p className="mt-3 leading-relaxed text-blue-100/90 relative z-10">{businessSummary}</p>
      </article>
    </div>
  );
}

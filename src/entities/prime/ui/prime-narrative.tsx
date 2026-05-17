interface PrimeNarrativeProps {
  narrative: string;
  businessSummary: string;
}

export function PrimeNarrative({ narrative, businessSummary }: PrimeNarrativeProps) {
  return (
    <div className="space-y-3">
      <article className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Operations Narrative</p>
        <p className="mt-2 leading-relaxed">{narrative}</p>
      </article>
      <article className="rounded-xl border border-cyan-200 bg-gradient-to-r from-slate-900 to-cyan-900 p-3 text-sm text-cyan-50">
        <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Business Summary</p>
        <p className="mt-2 leading-relaxed">{businessSummary}</p>
      </article>
    </div>
  );
}


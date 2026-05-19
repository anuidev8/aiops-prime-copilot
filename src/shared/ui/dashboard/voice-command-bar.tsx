"use client";

export function VoiceCommandBar() {
  return (
    <div className="flex items-center gap-4 rounded-[2rem] border border-border bg-white/92 px-6 py-4 shadow-[0_16px_36px_-28px_hsl(225_30%_30%/0.55)]">
      <span className="hidden shrink-0 text-sm text-muted-foreground sm:block">
        Ask anything about your systems
      </span>
      <div className="flex h-8 flex-1 items-end justify-center gap-0.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={`l-${i}`}
            className="animate-wave w-0.5 rounded-full bg-primary/45"
            style={{
              height: `${20 + Math.sin(i / 2) * 40 + 30}%`,
              animationDelay: `${i * 60}ms`,
            }}
          />
        ))}
        <button
          type="button"
          aria-label="Voice command"
          className="relative mx-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-[0_14px_32px_-14px_hsl(var(--primary)/0.8)]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
        </button>
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={`r-${i}`}
            className="animate-wave w-0.5 rounded-full bg-primary/38"
            style={{
              height: `${20 + Math.cos(i / 2) * 40 + 30}%`,
              animationDelay: `${(i + 12) * 60}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

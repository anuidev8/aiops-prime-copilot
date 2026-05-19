"use client";

export function VoiceCommandBar() {
  return (
    <div className="glass-strong rounded-[2rem] px-6 py-4 flex items-center gap-4 neon-ring">
      <span className="text-muted-foreground text-sm shrink-0 hidden sm:block">
        Ask anything about your systems
      </span>
      <div className="flex items-end gap-0.5 h-8 flex-1 justify-center">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={`l-${i}`}
            className="w-0.5 rounded-full bg-primary/50 animate-wave"
            style={{
              height: `${20 + Math.sin(i / 2) * 40 + 30}%`,
              animationDelay: `${i * 60}ms`,
            }}
          />
        ))}
        <button
          type="button"
          aria-label="Voice command"
          className="relative mx-3 w-12 h-12 rounded-full bg-gradient-primary text-primary-foreground border border-primary/40 flex items-center justify-center shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.6)] shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
        </button>
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={`r-${i}`}
            className="w-0.5 rounded-full bg-primary/40 animate-wave"
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

export function EtymologyBlock({ etymology }: { etymology: string }) {
  if (!etymology) return null;
  return (
    <div class="bg-bg-surface border border-border rounded-xl p-5">
      <p class="text-xs font-semibold text-text-disabled uppercase tracking-wider mb-2">Etymology</p>
      <p class="text-sm text-text-secondary leading-relaxed">{etymology}</p>
    </div>
  );
}


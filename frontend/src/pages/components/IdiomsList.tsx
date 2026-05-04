export function IdiomsList({ idioms }: { idioms: { phrase: string; meaning: string }[] }) {
  if (!idioms || idioms.length === 0) return null;
  return (
    <div class="bg-bg-surface border border-border rounded-xl p-5">
      <p class="text-xs font-semibold text-text-disabled uppercase tracking-wider mb-3">Idioms</p>
      <ul class="space-y-3">
        {idioms.map((idiom, i) => (
          <li key={i} class="text-sm">
            <span class="text-brand font-semibold italic">"{idiom.phrase}"</span>
            <span class="text-text-secondary"> — {idiom.meaning}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}


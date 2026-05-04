export function SynonymsBar({ synonyms, related_words, usage_notes }: { synonyms: string[]; related_words: string[]; usage_notes: string }) {
  const hasContent = synonyms.length > 0 || related_words.length > 0 || usage_notes;
  if (!hasContent) return null;

  return (
    <div class="bg-bg-surface border border-border rounded-xl p-5 space-y-4">
      {synonyms.length > 0 && (
        <div>
          <p class="text-xs font-semibold text-text-disabled uppercase tracking-wider mb-2">Synonyms</p>
          <div class="flex flex-wrap gap-2">
            {synonyms.map(s => (
              <span key={s} class="bg-bg-elevated text-text-secondary px-2.5 py-1 rounded-full text-xs">{s}</span>
            ))}
          </div>
        </div>
      )}
      {related_words.length > 0 && (
        <div>
          <p class="text-xs font-semibold text-text-disabled uppercase tracking-wider mb-2">Related words</p>
          <div class="flex flex-wrap gap-2">
            {related_words.map(w => (
              <span key={w} class="bg-bg-base border border-border text-text-secondary px-2.5 py-1 rounded-full text-xs">{w}</span>
            ))}
          </div>
        </div>
      )}
      {usage_notes && (
        <div>
          <p class="text-xs font-semibold text-text-disabled uppercase tracking-wider mb-2">Usage notes</p>
          <p class="text-sm text-text-secondary leading-relaxed">{usage_notes}</p>
        </div>
      )}
    </div>
  );
}


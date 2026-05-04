export function SynonymsBar({ synonyms, related_words, usage_notes }: { synonyms: string[]; related_words: string[]; usage_notes: string }) {
  const hasContent = synonyms.length > 0 || related_words.length > 0 || usage_notes;
  if (!hasContent) return null;

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-5 space-y-4">
      {synonyms.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Synonyms</p>
          <div className="flex flex-wrap gap-2">
            {synonyms.map(s => (
              <span key={s} className="bg-navy-700 text-gray-300 px-2.5 py-1 rounded-full text-xs">{s}</span>
            ))}
          </div>
        </div>
      )}
      {related_words.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Related words</p>
          <div className="flex flex-wrap gap-2">
            {related_words.map(w => (
              <span key={w} className="bg-navy-900 border border-navy-700 text-gray-400 px-2.5 py-1 rounded-full text-xs">{w}</span>
            ))}
          </div>
        </div>
      )}
      {usage_notes && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Usage notes</p>
          <p className="text-sm text-gray-400 leading-relaxed">{usage_notes}</p>
        </div>
      )}
    </div>
  );
}

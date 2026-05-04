export function IdiomsList({ idioms }: { idioms: { phrase: string; meaning: string }[] }) {
  if (!idioms || idioms.length === 0) return null;
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Idioms</p>
      <ul className="space-y-3">
        {idioms.map((idiom, i) => (
          <li key={i} className="text-sm">
            <span className="text-electric-400 font-semibold italic">"{idiom.phrase}"</span>
            <span className="text-gray-400"> — {idiom.meaning}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

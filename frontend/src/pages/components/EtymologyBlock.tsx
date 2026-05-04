export function EtymologyBlock({ etymology }: { etymology: string }) {
  if (!etymology) return null;
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Etymology</p>
      <p className="text-sm text-gray-300 leading-relaxed">{etymology}</p>
    </div>
  );
}

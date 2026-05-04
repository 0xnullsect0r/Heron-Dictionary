import { Definition } from '../../types/dictionary';

interface DefinitionCardProps {
  definition: Definition;
  index?: number;
}

export function DefinitionCard({ definition, index = 1 }: DefinitionCardProps) {
  if (!definition.text) {
    return (
      <div className="bg-navy-800/50 border border-navy-700 border-dashed rounded-xl p-6 text-gray-500 text-sm italic">
        No {definition.level} definition available yet.
      </div>
    );
  }

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-navy-700/60">
        <p className="text-white text-base leading-relaxed">
          <span className="text-electric-400 font-semibold mr-2">{index}.</span>
          {definition.text}
        </p>
      </div>

      {definition.sentences.length > 0 && (
        <div className="px-6 py-4 border-b border-navy-700/60">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Example sentences</p>
          <ol className="space-y-2">
            {definition.sentences.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-300">
                <span className="text-electric-500 font-mono text-xs mt-0.5">{i + 1}.</span>
                <span className="italic">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {definition.examples.length > 0 && (
        <div className="px-6 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Usage examples</p>
          <ul className="space-y-2">
            {definition.examples.map((e, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-400">
                <span className="text-navy-500">→</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

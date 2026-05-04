import { Definition } from '../../types/dictionary';

interface DefinitionCardProps {
  definition: Definition;
  index?: number;
}

export function DefinitionCard({ definition, index = 1 }: DefinitionCardProps) {
  if (!definition.text) {
    return (
      <div class="bg-bg-surface/50 border border-border border-dashed rounded-xl p-6 text-text-disabled text-sm italic">
        No {definition.level} definition available yet.
      </div>
    );
  }

  return (
    <div class="bg-bg-surface border border-border rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-border/60">
        <p class="text-text-primary text-base leading-relaxed">
          <span class="text-brand font-semibold mr-2">{index}.</span>
          {definition.text}
        </p>
      </div>

      {definition.sentences.length > 0 && (
        <div class="px-6 py-4 border-b border-border/60">
          <p class="text-xs font-semibold text-text-disabled uppercase tracking-wider mb-3">Example sentences</p>
          <ol class="space-y-2">
            {definition.sentences.map((s, i) => (
              <li key={i} class="flex gap-3 text-sm text-text-secondary">
                <span class="text-brand font-mono text-xs mt-0.5">{i + 1}.</span>
                <span class="italic">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {definition.examples.length > 0 && (
        <div class="px-6 py-4">
          <p class="text-xs font-semibold text-text-disabled uppercase tracking-wider mb-3">Usage examples</p>
          <ul class="space-y-2">
            {definition.examples.map((e, i) => (
              <li key={i} class="flex gap-2 text-sm text-text-secondary">
                <span class="text-brand opacity-60">→</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


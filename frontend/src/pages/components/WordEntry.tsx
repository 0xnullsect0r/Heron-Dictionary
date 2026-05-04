import { useState } from 'preact/hooks';
import { WordEntry as WordEntryType, Level } from '../../types/dictionary';
import { LevelSelector } from './LevelSelector';
import { DefinitionCard } from './DefinitionCard';
import { EtymologyBlock } from './EtymologyBlock';
import { IdiomsList } from './IdiomsList';
import { SynonymsBar } from './SynonymsBar';

interface WordEntryProps {
  entry: WordEntryType;
  initialLevel?: Level;
}

export function WordEntry({ entry, initialLevel = 'standard' }: WordEntryProps) {
  const [level, setLevel] = useState<Level>(initialLevel);

  const allDefs = entry.definitions.filter(d => d.level === level);

  return (
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-4xl font-bold text-text-primary">{entry.word}</h1>
          {entry.part_of_speech && (
            <p class="text-brand text-sm font-medium mt-1 italic">{entry.part_of_speech}</p>
          )}
        </div>
        <LevelSelector value={level} onChange={setLevel} />
      </div>

      <div class="space-y-4">
        {allDefs.length > 0 ? (
          allDefs.map((def, i) => <DefinitionCard key={def.id} definition={def} index={i + 1} />)
        ) : (
          <div class="bg-bg-surface/50 border border-border border-dashed rounded-xl p-6 text-text-disabled text-sm italic">
            No {level} definition available yet.
          </div>
        )}
      </div>

      {/* Study-Tech prompt */}
      <div class="bg-brand/10 border border-brand/30 rounded-xl p-4">
        <p class="text-brand text-sm font-medium">💡 Study Tip</p>
        <p class="text-brand/70 text-sm mt-1">
          Use the word <strong class="text-brand">{entry.word}</strong> in your own sentence before moving on.
          Understanding a word means being able to use it — not just recognize it.
        </p>
      </div>

      <EtymologyBlock etymology={entry.etymology} />
      <SynonymsBar synonyms={entry.synonyms} related_words={entry.related_words} usage_notes={entry.usage_notes} />
      <IdiomsList idioms={entry.idioms} />
    </div>
  );
}


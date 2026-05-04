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
    <div className="space-y-6">
      {/* Word header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">{entry.word}</h1>
          {entry.part_of_speech && (
            <p className="text-electric-400 text-sm font-medium mt-1 italic">{entry.part_of_speech}</p>
          )}
        </div>
        <LevelSelector value={level} onChange={setLevel} />
      </div>

      {/* Definitions for selected level */}
      <div className="space-y-4">
        {allDefs.length > 0 ? (
          allDefs.map((def, i) => <DefinitionCard key={def.id} definition={def} index={i + 1} />)
        ) : (
          <div className="bg-navy-800/50 border border-navy-700 border-dashed rounded-xl p-6 text-gray-500 text-sm italic">
            No {level} definition available yet.
          </div>
        )}
      </div>

      {/* Study-Tech prompt */}
      <div className="bg-electric-900/20 border border-electric-800/40 rounded-xl p-4">
        <p className="text-electric-300 text-sm font-medium">💡 Study Tip</p>
        <p className="text-electric-200/70 text-sm mt-1">
          Use the word <strong className="text-electric-300">{entry.word}</strong> in your own sentence before moving on.
          Understanding a word means being able to use it — not just recognize it.
        </p>
      </div>

      {/* Etymology */}
      <EtymologyBlock etymology={entry.etymology} />

      {/* Synonyms + related + notes */}
      <SynonymsBar synonyms={entry.synonyms} related_words={entry.related_words} usage_notes={entry.usage_notes} />

      {/* Idioms */}
      <IdiomsList idioms={entry.idioms} />
    </div>
  );
}

import { Level } from '../../types/dictionary';

const levels: { value: Level; label: string; description: string }[] = [
  { value: 'basic', label: 'Basic', description: 'Plain language, concrete examples' },
  { value: 'standard', label: 'Standard', description: 'Dictionary-grade definition' },
  { value: 'advanced', label: 'Advanced', description: 'Full nuance, technical context' },
];

interface LevelSelectorProps {
  value: Level;
  onChange: (level: Level) => void;
}

export function LevelSelector({ value, onChange }: LevelSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400 font-medium">Definition level:</span>
      <select
        value={value}
        onChange={e => onChange((e.target as HTMLSelectElement).value as Level)}
        className="bg-navy-800 border border-navy-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 cursor-pointer"
      >
        {levels.map(l => (
          <option key={l.value} value={l.value}>{l.label} — {l.description}</option>
        ))}
      </select>
    </div>
  );
}

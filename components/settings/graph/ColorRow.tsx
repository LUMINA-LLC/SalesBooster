'use client';

interface ColorRowProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}

export default function ColorRow({
  label,
  description,
  value,
  onChange,
}: ColorRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-gray-700">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 border border-gray-300 rounded px-2 py-1 text-sm font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

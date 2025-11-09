'use client';

import { TEAM_COLORS } from '@/lib/types';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  usedColors?: string[];
}

export function ColorPicker({ value, onChange, usedColors = [] }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TEAM_COLORS.map(color => {
        const isUsed = usedColors.includes(color) && color !== value;
        const isSelected = value === color;
        
        return (
          <button
            key={color}
            onClick={() => !isUsed && onChange(color)}
            disabled={isUsed}
            className={`
              w-10 h-10 rounded-full border-2 transition-all
              ${isSelected ? 'border-white scale-110 ring-2 ring-white ring-offset-2 ring-offset-gray-800' : 'border-gray-600'}
              ${isUsed ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105'}
            `}
            style={{ backgroundColor: color }}
            aria-label={`Select ${color} color`}
          />
        );
      })}
    </div>
  );
}

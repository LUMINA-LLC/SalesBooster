'use client';

import React from 'react';
import { PeriodUnit } from '@/types';

interface PeriodUnitToggleProps {
  periodUnit: PeriodUnit;
  onPeriodUnitChange: (unit: PeriodUnit) => void;
}

const periodUnits: PeriodUnit[] = ['月', '週', '日'];

export default function PeriodUnitToggle({
  periodUnit,
  onPeriodUnitChange,
}: PeriodUnitToggleProps) {
  return (
    <div className="flex items-center border border-gray-300 rounded bg-white">
      {periodUnits.map((unit, index) => (
        <button
          key={unit}
          className={`px-3 py-1 text-sm ${index > 0 ? 'border-l border-gray-300' : ''} ${
            periodUnit === unit
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => onPeriodUnitChange(unit)}
        >
          {unit}
        </button>
      ))}
    </div>
  );
}

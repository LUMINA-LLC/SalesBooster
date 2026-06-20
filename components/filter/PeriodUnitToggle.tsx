'use client';

import Button from '@/components/common/Button';
import { PeriodUnit } from '@/types/salesView';
import { PERIOD_UNITS } from '@/const/salesView';

interface PeriodUnitToggleProps {
  periodUnit: PeriodUnit;
  onPeriodUnitChange: (unit: PeriodUnit) => void;
}

export default function PeriodUnitToggle({
  periodUnit,
  onPeriodUnitChange,
}: PeriodUnitToggleProps) {
  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5">
      {PERIOD_UNITS.map((unit) => (
        <Button
          key={unit}
          label={unit}
          variant="ghost"
          color="indigo"
          size="sm"
          isActive={periodUnit === unit}
          onClick={() => onPeriodUnitChange(unit)}
        />
      ))}
    </div>
  );
}

import { ReportDataTypeMetrics } from '@/types/report';
import MetricRow from './MetricRow';

interface DataTypeBlockProps {
  dt: ReportDataTypeMetrics;
  expanded: boolean;
  onToggle: (dataTypeId: number) => void;
}

/** データ種類1つ分（メイン値＋カスタムフィールド）のブロック */
export default function DataTypeBlock({
  dt,
  expanded,
  onToggle,
}: DataTypeBlockProps) {
  const hasCustomFields = dt.customFields.length > 0;
  return (
    <div className="border-b border-gray-100 py-1 last:border-b-0">
      <MetricRow
        label={dt.dataTypeName}
        metric={dt.main}
        emphasize
        toggle={
          hasCustomFields
            ? { expanded, onToggle: () => onToggle(dt.dataTypeId) }
            : undefined
        }
      />
      {expanded &&
        dt.customFields.map((cf) => (
          <MetricRow key={cf.id} label={cf.name} metric={cf.metric} />
        ))}
    </div>
  );
}

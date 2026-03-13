'use client';

import { useState, useRef, ReactNode } from 'react';
import ExcelJS from 'exceljs';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import { Dialog } from '@/components/common/Dialog';

// --- 汎用型定義 ---

export interface ImportField {
  /** フィールドキー（例: 'name', 'email'） */
  value: string;
  /** 表示ラベル（例: '名前 *'） */
  label: string;
  /** 必須フィールドか */
  required: boolean;
  /** 自動マッピング用キーワード（小文字で定義。ヘッダー名にこれが含まれていたらマッチ） */
  autoMapKeywords: string[];
}

export interface MappedRow {
  [key: string]: string | undefined;
  error?: string;
}

export interface ImportResult {
  /** インポート結果のサマリメッセージ */
  message: string;
}

export interface PreviewColumn {
  key: string;
  label: string;
  render?: (row: MappedRow) => ReactNode;
}

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
  /** モーダルタイトルのプレフィックス（例: 'メンバー'）。ステップごとに「○○インポート」「カラムマッピング」「インポートプレビュー」となる */
  titlePrefix: string;
  /** インポート対象のフィールド定義 */
  fields: ImportField[];
  /** プレビューテーブルのカラム定義 */
  previewColumns: PreviewColumn[];
  /** マッピング結果をバリデーション・変換する関数。各行に error フィールドを付与 */
  buildMappedData: (
    rows: ParsedRow[],
    mapping: Record<string, string>,
  ) => MappedRow[];
  /** 有効な行をAPIに送信する関数。結果のサマリメッセージを返す */
  onImport: (validRows: MappedRow[]) => Promise<ImportResult>;
  /** モーダルが開いた時に呼ばれるコールバック（追加データのフェッチなど） */
  onOpen?: () => void;
}

export interface ParsedRow {
  [key: string]: string;
}

/** ExcelJSのセル値を文字列に変換（ハイパーリンク・リッチテキスト・数式等のオブジェクト対応） */
function cellValueToString(value: ExcelJS.CellValue): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    // ハイパーリンク: { text: '...', hyperlink: '...' }
    if ('text' in value && typeof value.text === 'string')
      return value.text.trim();
    // リッチテキスト: { richText: [{ text: '...' }, ...] }
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText
        .map((rt: { text?: string }) => rt.text || '')
        .join('')
        .trim();
    }
    // 数式結果: { result: '...' }
    if ('result' in value && value.result != null)
      return String(value.result).trim();
    // SharedString等
    if ('sharedFormula' in value) return '';
  }
  return String(value).trim();
}

// --- 汎用インポートモーダル本体 ---

export default function ImportModal({
  isOpen,
  onClose,
  onImported,
  titlePrefix,
  fields,
  previewColumns,
  buildMappedData,
  onImport,
  onOpen,
}: ImportModalProps) {
  type Step = 'file' | 'mapping' | 'preview';

  const [step, setStep] = useState<Step>('file');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [mappedData, setMappedData] = useState<MappedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // モーダルオープン時のリセット
  const handleOpen = () => {
    setStep('file');
    setHeaders([]);
    setRows([]);
    setMapping({});
    setMappedData([]);
    setFileName('');
    onOpen?.();
  };

  // isOpen の変化を監視してリセット
  const prevIsOpenRef = useRef(false);
  if (isOpen && !prevIsOpenRef.current) {
    handleOpen();
  }
  prevIsOpenRef.current = isOpen;

  const fieldOptions = [
    { value: '', label: '-- スキップ --' },
    ...fields.map((f) => ({ value: f.value, label: f.label })),
  ];

  const parseFile = async (file: File) => {
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) {
          Dialog.error(
            'ファイルにデータが含まれていません（ヘッダー行 + 1行以上必要です）。',
          );
          return;
        }
        const csvSheet = workbook.addWorksheet('csv');
        lines.forEach((line) => {
          const values = line
            .split(',')
            .map((v) => v.replace(/^"|"$/g, '').trim());
          csvSheet.addRow(values);
        });
      } else {
        await workbook.xlsx.load(buffer);
      }

      const sheet = workbook.worksheets[0];
      if (!sheet || sheet.rowCount < 2) {
        Dialog.error(
          'ファイルにデータが含まれていません（ヘッダー行 + 1行以上必要です）。',
        );
        return;
      }

      const headerRow = sheet.getRow(1);
      const fileHeaders: string[] = [];
      headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        fileHeaders[colNumber - 1] = cellValueToString(cell.value);
      });

      const fileRows: ParsedRow[] = [];
      for (let r = 2; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        const isEmpty =
          !row.cellCount ||
          fileHeaders.every((_, i) => {
            const val = cellValueToString(row.getCell(i + 1).value);
            return val === '' || val === 'null';
          });
        if (isEmpty) continue;

        const obj: ParsedRow = {};
        fileHeaders.forEach((h, i) => {
          obj[h] = cellValueToString(row.getCell(i + 1).value);
        });
        fileRows.push(obj);
      }

      if (fileRows.length === 0) {
        Dialog.error(
          'ファイルにデータが含まれていません（ヘッダー行 + 1行以上必要です）。',
        );
        return;
      }

      setHeaders(fileHeaders);
      setRows(fileRows);

      // 自動マッピング
      const autoMapping: Record<string, string> = {};
      fileHeaders.forEach((h) => {
        const lower = h.toLowerCase();
        let matched = false;
        for (const field of fields) {
          if (field.autoMapKeywords.some((kw) => lower.includes(kw))) {
            // 同じフィールドが既にマッピング済みでなければ割り当て
            if (!Object.values(autoMapping).includes(field.value)) {
              autoMapping[h] = field.value;
              matched = true;
              break;
            }
          }
        }
        if (!matched) {
          autoMapping[h] = '';
        }
      });
      setMapping(autoMapping);
      setStep('mapping');
    } catch {
      Dialog.error(
        'ファイルの読み込みに失敗しました。対応形式（CSV, XLSX）か確認してください。',
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const handleMappingChange = (header: string, value: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (value) {
        Object.keys(next).forEach((key) => {
          if (next[key] === value) next[key] = '';
        });
      }
      next[header] = value;
      return next;
    });
  };

  const handleGoToPreview = () => {
    const requiredFields = fields.filter((f) => f.required);
    const missingFields = requiredFields.filter(
      (f) => !Object.values(mapping).includes(f.value),
    );
    if (missingFields.length > 0) {
      const labels = missingFields
        .map((f) => `「${f.label.replace(' *', '')}」`)
        .join('、');
      Dialog.error(`${labels}は必須です。対応するカラムを選択してください。`);
      return;
    }
    setMappedData(buildMappedData(rows, mapping));
    setStep('preview');
  };

  const handleImport = async () => {
    const validRows = mappedData.filter((m) => !m.error);
    if (validRows.length === 0) {
      await Dialog.error('インポート可能なデータがありません。');
      return;
    }

    setImporting(true);
    try {
      const result = await onImport(validRows);
      onClose();
      await Dialog.success(result.message);
      onImported();
    } catch {
      await Dialog.error(
        'インポートに失敗しました。ネットワーク接続を確認してください。',
      );
    } finally {
      setImporting(false);
    }
  };

  const errorCount = mappedData.filter((m) => m.error).length;
  const validCount = mappedData.filter((m) => !m.error).length;

  // --- ステップ別レンダリング ---

  const renderFileStep = () => (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
      >
        <svg
          className="w-12 h-12 text-gray-400 mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-sm text-gray-600 mb-1">
          ファイルをドラッグ＆ドロップ
        </p>
        <p className="text-xs text-gray-400">
          または クリックしてファイルを選択
        </p>
        <p className="text-xs text-gray-400 mt-2">対応形式: CSV, XLSX</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );

  const renderMappingStep = () => (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          ファイル:{' '}
          <span className="font-medium text-gray-800">{fileName}</span>（
          {rows.length}行）
        </p>
        <p className="text-xs text-gray-400 mt-1">
          各カラムに対応するフィールドを選択してください。
          <span className="text-red-500">*</span> は必須です。
        </p>
      </div>
      <div className="space-y-3">
        {headers.map((header) => (
          <div key={header} className="flex items-center gap-3">
            <div className="w-1/2 min-w-0">
              <span
                className="text-sm text-gray-800 font-medium truncate block"
                title={header}
              >
                {header}
              </span>
              <span className="text-xs text-gray-400 truncate block">
                例: {rows[0]?.[header] || '-'}
              </span>
            </div>
            <svg
              className="w-4 h-4 text-gray-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
            <Select
              value={mapping[header] || ''}
              onChange={(value) => handleMappingChange(header, value)}
              options={fieldOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              className="w-1/2"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-gray-600">
          有効: <span className="font-bold text-green-600">{validCount}件</span>
        </span>
        {errorCount > 0 && (
          <span className="text-sm text-gray-600">
            エラー:{' '}
            <span className="font-bold text-red-600">{errorCount}件</span>
          </span>
        )}
      </div>
      <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                #
              </th>
              {previewColumns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                状態
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mappedData.map((row, i) => (
              <tr key={i} className={row.error ? 'bg-red-50' : ''}>
                <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                {previewColumns.map((col) => (
                  <td key={col.key} className="px-3 py-2 text-gray-600">
                    {col.render
                      ? col.render(row)
                      : row[col.key] || <span className="text-red-400">-</span>}
                  </td>
                ))}
                <td className="px-3 py-2">
                  {row.error ? (
                    <span className="text-xs text-red-600">{row.error}</span>
                  ) : (
                    <span className="text-xs text-green-600">OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {errorCount > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          ※ エラーの行はスキップされ、有効な行のみインポートされます。
        </p>
      )}
    </div>
  );

  const footer = (
    <>
      {step === 'file' && (
        <Button
          label="キャンセル"
          variant="outline"
          color="gray"
          onClick={onClose}
        />
      )}
      {step === 'mapping' && (
        <>
          <Button
            label="戻る"
            variant="outline"
            color="gray"
            onClick={() => setStep('file')}
          />
          <Button label="プレビュー" onClick={handleGoToPreview} />
        </>
      )}
      {step === 'preview' && (
        <>
          <Button
            label="戻る"
            variant="outline"
            color="gray"
            onClick={() => setStep('mapping')}
          />
          <Button
            label={
              importing ? 'インポート中...' : `${validCount}件をインポート`
            }
            onClick={handleImport}
            disabled={importing || validCount === 0}
          />
        </>
      )}
    </>
  );

  const title =
    step === 'file'
      ? `${titlePrefix}インポート`
      : step === 'mapping'
        ? 'カラムマッピング'
        : 'インポートプレビュー';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      maxWidth="lg"
    >
      {step === 'file' && renderFileStep()}
      {step === 'mapping' && renderMappingStep()}
      {step === 'preview' && renderPreviewStep()}
    </Modal>
  );
}

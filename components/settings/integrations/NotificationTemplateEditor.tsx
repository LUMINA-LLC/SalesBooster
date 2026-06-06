'use client';

import { useRef } from 'react';
import {
  TEMPLATE_VARIABLES,
  previewNotificationTemplate,
} from '@/types/notificationTemplate';

interface Props {
  /** テンプレート本文 */
  template: string;
  onTemplateChange: (value: string) => void;
  /** 顔写真送信ON/OFF */
  sendMemberImage: boolean;
  onSendMemberImageChange: (value: boolean) => void;
  /** 画像送信の説明（サービスごとの注記） */
  imageHelpText?: string;
}

export default function NotificationTemplateEditor({
  template,
  onTemplateChange,
  sendMemberImage,
  onSendMemberImageChange,
  imageHelpText,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = (key: string) => {
    const token = `{${key}}`;
    const el = textareaRef.current;
    if (!el) {
      onTemplateChange(`${template}${token}`);
      return;
    }
    const start = el.selectionStart ?? template.length;
    const end = el.selectionEnd ?? template.length;
    const next = template.slice(0, start) + token + template.slice(end);
    onTemplateChange(next);
    // カーソルを挿入後に移動
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const preview = previewNotificationTemplate(template);

  return (
    <div className="space-y-4 border-t border-gray-200 pt-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          送信メッセージのテンプレート
        </label>
        <p className="mb-2 text-xs text-gray-400">
          下のボタンで変数を挿入できます。空のままにすると標準のフォーマットで送信されます。
        </p>

        <div className="mb-2 flex flex-wrap gap-1.5">
          {TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVariable(v.key)}
              title={v.label}
              className="px-2 py-1 text-xs rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              {`{${v.key}}`}
            </button>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={template}
          onChange={(e) => onTemplateChange(e.target.value)}
          rows={6}
          placeholder={'例:\n🎉 {担当}さんが{値と単位}を達成！\n種別: {種別}\n日付: {日付}'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-400">
          データ種類ごとのカスタム項目は、その項目名で {'{項目名}'}{' '}
          のように指定できます。
        </p>
      </div>

      {template.trim() && (
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">
            プレビュー（サンプル値）
          </div>
          <pre className="whitespace-pre-wrap break-words rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700">
            {preview}
          </pre>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={sendMemberImage}
            onChange={(e) => onSendMemberImageChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            担当者の顔写真も一緒に送信する
          </span>
        </label>
        <p className="mt-1 ml-6 text-xs text-gray-400">
          {imageHelpText ||
            '顔写真が登録されているメンバーのみ画像が送信されます。'}
        </p>
      </div>
    </div>
  );
}

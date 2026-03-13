'use client';

import React, { useState, useEffect } from 'react';

interface MemberInput {
  name: string;
  email: string;
  password: string;
  saved: boolean;
}

const EMPTY_MEMBER: MemberInput = {
  name: '',
  email: '',
  password: '',
  saved: false,
};

export default function StepMembers() {
  const [members, setMembers] = useState<MemberInput[]>([{ ...EMPTY_MEMBER }]);
  const [existingCount, setExistingCount] = useState(0);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/members')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setExistingCount(data.length);
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (
    index: number,
    field: keyof MemberInput,
    value: string,
  ) => {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
    setError(null);
  };

  const handleSave = async (index: number) => {
    const member = members[index];
    if (
      !member.name.trim() ||
      !member.email.trim() ||
      !member.password.trim()
    ) {
      setError('名前・メールアドレス・パスワードは必須です');
      return;
    }
    if (member.password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    setSaving(index);
    setError(null);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: member.name.trim(),
          email: member.email.trim(),
          password: member.password,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'メンバーの登録に失敗しました');
      }
      setMembers((prev) => {
        const updated = [...prev];
        updated[index] = { ...member, saved: true };
        if (updated[updated.length - 1].saved) {
          updated.push({ ...EMPTY_MEMBER });
        }
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setSaving(null);
    }
  };

  const handleRemoveRow = (index: number) => {
    setMembers((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0 || updated[updated.length - 1].saved) {
        updated.push({ ...EMPTY_MEMBER });
      }
      return updated;
    });
  };

  const savedCount = members.filter((m) => m.saved).length;

  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">
        営業メンバーを登録します。後から追加・変更も可能です。
        {existingCount > 0 && (
          <span className="text-blue-600 ml-1">
            （既に{existingCount}名登録済み）
          </span>
        )}
      </p>

      <div className="space-y-3">
        {members.map((member, index) => (
          <div
            key={index}
            className={`p-3 border rounded-lg ${member.saved ? 'bg-gray-50 border-gray-200' : 'border-gray-300'}`}
          >
            {member.saved ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    {member.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({member.email})
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveRow(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) =>
                      handleChange(index, 'name', e.target.value)
                    }
                    placeholder="名前"
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    value={member.email}
                    onChange={(e) =>
                      handleChange(index, 'email', e.target.value)
                    }
                    placeholder="メールアドレス"
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={member.password}
                    onChange={(e) =>
                      handleChange(index, 'password', e.target.value)
                    }
                    placeholder="パスワード（8文字以上）"
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleSave(index)}
                    disabled={
                      saving === index ||
                      !member.name.trim() ||
                      !member.email.trim() ||
                      !member.password.trim()
                    }
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    {saving === index ? '保存中...' : '追加'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {savedCount > 0 && (
        <p className="mt-3 text-sm text-green-600">
          {savedCount}名のメンバーを登録しました
        </p>
      )}

      <p className="mt-4 text-xs text-gray-400">
        メンバーは後から設定画面で追加・編集できます。スキップして次へ進むこともできます。
      </p>
    </div>
  );
}

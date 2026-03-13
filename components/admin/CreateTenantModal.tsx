'use client';

import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

const PLAN_TYPE_OPTIONS = [
  { value: 'TRIAL', label: 'トライアル' },
  { value: 'STANDARD', label: 'スタンダード' },
  { value: 'ENTERPRISE', label: 'エンタープライズ' },
] as const;

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateTenantModal({
  isOpen,
  onClose,
  onCreated,
}: CreateTenantModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');

  // ライセンス情報
  const [planType, setPlanType] = useState('TRIAL');
  const [maxMembers, setMaxMembers] = useState('');
  const [licenseStartDate, setLicenseStartDate] = useState('');
  const [licenseEndDate, setLicenseEndDate] = useState('');
  const [isTrial, setIsTrial] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          adminEmail,
          adminPassword,
          adminName: adminName || undefined,
          planType,
          maxMembers: maxMembers !== '' ? Number(maxMembers) : null,
          licenseStartDate: licenseStartDate || null,
          licenseEndDate: licenseEndDate || null,
          isTrial,
        }),
      });

      if (res.ok) {
        setName('');
        setSlug('');
        setAdminEmail('');
        setAdminPassword('');
        setAdminName('');
        setPlanType('TRIAL');
        setMaxMembers('');
        setLicenseStartDate('');
        setLicenseEndDate('');
        setIsTrial(true);
        onCreated();
        onClose();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'テナントの作成に失敗しました');
      }
    } catch {
      setError('ネットワークエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === nameToSlug(name)) {
      setSlug(nameToSlug(value));
    }
  };

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  const footer = (
    <>
      <Button
        label="キャンセル"
        variant="outline"
        color="gray"
        onClick={onClose}
      />
      <button
        type="submit"
        form="create-tenant-form"
        disabled={submitting}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? '作成中...' : '作成'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="新規テナント作成"
      footer={footer}
    >
      <form
        id="create-tenant-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* テナント情報 */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            テナント情報
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                テナント名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputClass}
                placeholder="例: 株式会社サンプル"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                会社アカウント <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className={`${inputClass} font-mono`}
                placeholder="例: abc12"
                pattern="[a-z0-9]{5,}"
                title="半角英数字5文字以上"
                required
                minLength={5}
              />
              <p className="text-xs text-gray-400 mt-1">
                半角英数字5文字以上（ログイン時に使用）
              </p>
            </div>
          </div>
        </section>

        {/* ライセンス情報 */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            ライセンス情報
          </h3>
          <div className="space-y-3 bg-blue-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  プラン <span className="text-red-500">*</span>
                </label>
                <select
                  value={planType}
                  onChange={(e) => {
                    setPlanType(e.target.value);
                    setIsTrial(e.target.value === 'TRIAL');
                  }}
                  className={inputClass}
                >
                  {PLAN_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メンバー上限
                  <span className="text-xs text-gray-400 font-normal ml-1">
                    空欄=無制限
                  </span>
                </label>
                <input
                  type="number"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(e.target.value)}
                  className={inputClass}
                  placeholder="無制限"
                  min={1}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始日
                </label>
                <input
                  type="date"
                  value={licenseStartDate}
                  onChange={(e) => setLicenseStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  終了日
                </label>
                <input
                  type="date"
                  value={licenseEndDate}
                  onChange={(e) => setLicenseEndDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="createIsTrial"
                checked={isTrial}
                onChange={(e) => setIsTrial(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="createIsTrial" className="text-sm text-gray-700">
                トライアル期間中
              </label>
            </div>
            <p className="text-xs text-gray-400">
              未入力の場合、トライアルプラン（30日間）で自動設定されます
            </p>
          </div>
        </section>

        {/* 管理者アカウント */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            初期管理者アカウント
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                管理者名
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className={inputClass}
                placeholder="例: 管理者 太郎"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className={inputClass}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className={inputClass}
                placeholder="8文字以上"
                minLength={8}
                required
              />
            </div>
          </div>
        </section>
      </form>
    </Modal>
  );
}

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

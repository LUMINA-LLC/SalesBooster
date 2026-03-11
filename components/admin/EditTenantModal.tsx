'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/common/Dialog';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

const PLAN_TYPE_OPTIONS = [
  { value: 'TRIAL', label: 'トライアル' },
  { value: 'STANDARD', label: 'スタンダード' },
  { value: 'ENTERPRISE', label: 'エンタープライズ' },
] as const;

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
}

interface TenantForEdit {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  planType: string | null;
  maxMembers: number | null;
  licenseStartDate: string | null;
  licenseEndDate: string | null;
  isTrial: boolean;
  users: AdminUser[];
}

interface EditTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  tenantId: number | null;
}

const toDateInputValue = (iso: string | null): string => {
  if (!iso) return '';
  return new Date(iso).toISOString().split('T')[0];
};

export default function EditTenantModal({ isOpen, onClose, onUpdated, tenantId }: EditTenantModalProps) {
  const [tenant, setTenant] = useState<TenantForEdit | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);

  // ライセンス情報
  const [planType, setPlanType] = useState('TRIAL');
  const [maxMembers, setMaxMembers] = useState('');
  const [licenseStartDate, setLicenseStartDate] = useState('');
  const [licenseEndDate, setLicenseEndDate] = useState('');
  const [isTrial, setIsTrial] = useState(false);

  // 管理者編集
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    if (isOpen && tenantId) {
      setLoading(true);
      setSelectedAdminId('');
      setAdminPassword('');
      fetch(`/api/tenants/${tenantId}`)
        .then((res) => res.json())
        .then((data) => {
          const t = data?.data ?? data;
          setTenant(t);
          setName(t.name);
          setSlug(t.slug);
          setIsActive(t.isActive);
          setPlanType(t.planType || 'TRIAL');
          setMaxMembers(t.maxMembers !== null && t.maxMembers !== undefined ? String(t.maxMembers) : '');
          setLicenseStartDate(toDateInputValue(t.licenseStartDate));
          setLicenseEndDate(toDateInputValue(t.licenseEndDate));
          setIsTrial(t.isTrial ?? false);
          if (t.users?.length > 0) {
            selectAdmin(t.users[0]);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, tenantId]);

  const selectAdmin = (admin: AdminUser) => {
    setSelectedAdminId(admin.id);
    setAdminName(admin.name || '');
    setAdminEmail(admin.email);
    setAdminPassword('');
  };

  const handleSubmit = async () => {
    if (!tenantId || !name || !slug) return;

    if (adminPassword && adminPassword.length < 8) {
      await Dialog.error('パスワードは8文字以上で設定してください');
      return;
    }

    if (!/^[a-z0-9]{5,}$/.test(slug)) {
      await Dialog.error('会社アカウントは半角英数字5文字以上で設定してください');
      return;
    }

    if (!planType) {
      await Dialog.error('プランを選択してください');
      return;
    }

    if (!licenseEndDate) {
      await Dialog.error('ライセンス終了日を設定してください');
      return;
    }

    setSubmitting(true);
    try {
      // テナント情報更新
      const tenantRes = await fetch(`/api/tenants/${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, isActive }),
      });

      if (!tenantRes.ok) {
        const data = await tenantRes.json().catch(() => null);
        await Dialog.error(data?.error || 'テナント情報の更新に失敗しました');
        return;
      }

      // ライセンス情報更新
      const licenseRes = await fetch(`/api/tenants/${tenantId}/license`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType,
          maxMembers: maxMembers !== '' ? Number(maxMembers) : null,
          licenseStartDate: licenseStartDate || null,
          licenseEndDate,
          isTrial,
        }),
      });

      if (!licenseRes.ok) {
        const data = await licenseRes.json().catch(() => null);
        await Dialog.error(data?.error || 'ライセンス情報の更新に失敗しました');
        return;
      }

      // 管理者情報更新（変更がある場合）
      if (selectedAdminId) {
        const adminUpdateData: Record<string, string> = {};
        const originalAdmin = tenant?.users.find((u) => u.id === selectedAdminId);
        if (originalAdmin) {
          if (adminName !== (originalAdmin.name || '')) adminUpdateData.name = adminName;
          if (adminEmail !== originalAdmin.email) adminUpdateData.email = adminEmail;
        }
        if (adminPassword) adminUpdateData.password = adminPassword;

        if (Object.keys(adminUpdateData).length > 0) {
          const adminRes = await fetch(`/api/tenants/${tenantId}/admins/${selectedAdminId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminUpdateData),
          });
          if (!adminRes.ok) {
            const data = await adminRes.json().catch(() => null);
            await Dialog.error(data?.error || '管理者情報の更新に失敗しました');
            return;
          }
        }
      }

      onClose();
      await Dialog.success('テナント情報を更新しました');
      onUpdated();
    } catch (error) {
      console.error('Failed to update tenant:', error);
      await Dialog.error('更新に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  const footer = (
    <>
      <Button label="キャンセル" variant="outline" color="gray" onClick={onClose} />
      <Button label={submitting ? '更新中...' : '更新'} onClick={handleSubmit} disabled={submitting || !name || !slug} />
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="テナントを編集" footer={footer} maxWidth="lg">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-500">読み込み中...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* テナント情報 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">テナント情報</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">テナント名 <span className="text-red-500">*</span></label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">会社アカウント <span className="text-red-500">*</span></label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className={`${inputClass} font-mono`} pattern="[a-z0-9]{5,}" minLength={5} />
                <p className="text-xs text-gray-400 mt-1">半角英数字5文字以上（ログイン時に使用）</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setIsActive(true)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${isActive ? 'bg-green-50 border-green-300 text-green-700 font-medium' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                    有効
                  </button>
                  <button type="button" onClick={() => setIsActive(false)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${!isActive ? 'bg-red-50 border-red-300 text-red-700 font-medium' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                    無効
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ライセンス情報 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">ライセンス情報</h3>
            <div className="space-y-3 bg-blue-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">プラン <span className="text-red-500">*</span></label>
                  <select value={planType} onChange={(e) => { setPlanType(e.target.value); setIsTrial(e.target.value === 'TRIAL'); }} className={inputClass}>
                    {PLAN_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メンバー上限
                    <span className="text-xs text-gray-400 font-normal ml-1">空欄=無制限</span>
                  </label>
                  <input type="number" value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} className={inputClass} placeholder="無制限" min={1} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
                  <input type="date" value={licenseStartDate} onChange={(e) => setLicenseStartDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">終了日 <span className="text-red-500">*</span></label>
                  <input type="date" value={licenseEndDate} onChange={(e) => setLicenseEndDate(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isTrial" checked={isTrial} onChange={(e) => setIsTrial(e.target.checked)} className="rounded border-gray-300" />
                <label htmlFor="isTrial" className="text-sm text-gray-700">トライアル期間中</label>
              </div>
            </div>
          </section>

          {/* 管理者情報 */}
          {tenant && tenant.users.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">管理者アカウント</h3>

              {tenant.users.length > 1 && (
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">編集する管理者を選択</label>
                  <div className="flex flex-wrap gap-2">
                    {tenant.users.map((u) => (
                      <button key={u.id} type="button" onClick={() => selectAdmin(u)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${selectedAdminId === u.id ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                        {u.name || u.email}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">管理者名</label>
                  <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} className={`${inputClass} bg-white`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                  <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className={`${inputClass} bg-white`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    新しいパスワード
                    <span className="text-xs text-gray-400 font-normal ml-2">変更する場合のみ入力</span>
                  </label>
                  <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className={`${inputClass} bg-white`} placeholder="8文字以上" minLength={8} />
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}

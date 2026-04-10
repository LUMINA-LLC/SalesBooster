'use client';

import { useState } from 'react';
import ImportModal, {
  ImportField,
  MappedRow,
  PreviewColumn,
  ParsedRow,
} from '@/components/common/ImportModal';
import Select from '@/components/common/Select';

interface Department {
  id: number;
  name: string;
}

interface ImportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

type MemberType = 'member' | 'admin' | 'operator';

const MEMBER_TYPE_OPTIONS = [
  { value: 'member', label: 'メンバー' },
  { value: 'admin', label: '管理者' },
  { value: 'operator', label: '入力担当者' },
];

const FIELDS: ImportField[] = [
  {
    value: 'name',
    label: '名前 *',
    required: true,
    autoMapKeywords: ['名前', 'name', '氏名'],
  },
  {
    value: 'email',
    label: 'メールアドレス *',
    required: true,
    autoMapKeywords: ['メール', 'email', 'mail'],
  },
  {
    value: 'password',
    label: 'パスワード *',
    required: true,
    autoMapKeywords: ['パスワード', 'password', 'pw'],
  },
  {
    value: 'department',
    label: '部署',
    required: false,
    autoMapKeywords: ['部署', 'department', '部門', '所属'],
  },
];

const PREVIEW_COLUMNS: PreviewColumn[] = [
  {
    key: 'name',
    label: '名前',
    render: (row) => row.name || <span className="text-red-400">-</span>,
  },
  {
    key: 'email',
    label: 'メール',
    render: (row) => row.email || <span className="text-red-400">-</span>,
  },
  {
    key: 'password',
    label: 'パスワード',
    render: (row) =>
      row.password ? '********' : <span className="text-red-400">-</span>,
  },
  { key: 'department', label: '部署', render: (row) => row.department || '-' },
];

export default function ImportMembersModal({
  isOpen,
  onClose,
  onImported,
}: ImportMembersModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [memberType, setMemberType] = useState<MemberType>('member');

  const handleOpen = () => {
    setMemberType('member');
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => setDepartments(data))
      .catch(console.error);
  };

  const buildMappedData = (
    rows: ParsedRow[],
    mapping: Record<string, string>,
  ): MappedRow[] => {
    const nameHeader = Object.keys(mapping).find((k) => mapping[k] === 'name');
    const emailHeader = Object.keys(mapping).find(
      (k) => mapping[k] === 'email',
    );
    const passwordHeader = Object.keys(mapping).find(
      (k) => mapping[k] === 'password',
    );
    const deptHeader = Object.keys(mapping).find(
      (k) => mapping[k] === 'department',
    );

    return rows.map((row) => {
      const name = nameHeader ? row[nameHeader] : '';
      const email = emailHeader ? row[emailHeader] : '';
      const password = passwordHeader ? row[passwordHeader] : '';
      const dept = deptHeader ? row[deptHeader] : '';

      const errors: string[] = [];
      if (!name) errors.push('名前が未入力');
      if (!email) errors.push('メールが未入力');
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        errors.push('メール形式が不正');
      if (!password) errors.push('パスワードが未入力');
      if (password && password.length < 8) errors.push('パスワードは8文字以上');

      return {
        name,
        email,
        password,
        department: dept,
        error: errors.length > 0 ? errors.join(', ') : undefined,
      } as MappedRow;
    });
  };

  const handleImport = async (validRows: MappedRow[]) => {
    const role = memberType === 'admin' ? 'ADMIN' : 'USER';
    const isOperator = memberType === 'operator';

    const payload = validRows.map((m) => {
      const dept = departments.find((d) => d.name === m.department);
      return {
        name: m.name,
        email: m.email,
        password: m.password,
        role,
        isOperator,
        departmentId: dept?.id || undefined,
      };
    });

    const res = await fetch('/api/members/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members: payload }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || 'インポートに失敗しました。');
    }

    const result = await res.json();
    return {
      message:
        `インポート完了: ${result.created}件 追加` +
        (result.skipped > 0 ? `, ${result.skipped}件 重複スキップ` : '') +
        (result.errors?.length > 0 ? `, ${result.errors.length}件 エラー` : ''),
    };
  };

  const typeLabel =
    memberType === 'admin'
      ? '管理者'
      : memberType === 'operator'
        ? '入力担当者'
        : 'メンバー';

  return (
    <ImportModal
      isOpen={isOpen}
      onClose={onClose}
      onImported={onImported}
      titlePrefix={typeLabel}
      fields={FIELDS}
      previewColumns={PREVIEW_COLUMNS}
      buildMappedData={buildMappedData}
      onImport={handleImport}
      onOpen={handleOpen}
      headerContent={
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メンバー種別
          </label>
          <Select
            value={memberType}
            onChange={(value) => setMemberType(value as MemberType)}
            options={MEMBER_TYPE_OPTIONS}
          />
        </div>
      }
    />
  );
}

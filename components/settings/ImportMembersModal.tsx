'use client';

import { useState } from 'react';
import ImportModal, {
  ImportField,
  MappedRow,
  PreviewColumn,
  ParsedRow,
} from '@/components/common/ImportModal';

interface Department {
  id: number;
  name: string;
}

interface ImportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

const ROLE_MAP: Record<string, string> = {
  ユーザー: 'USER',
  user: 'USER',
  USER: 'USER',
  管理者: 'ADMIN',
  admin: 'ADMIN',
  ADMIN: 'ADMIN',
};

const ROLE_LABEL: Record<string, string> = {
  USER: 'ユーザー',
  ADMIN: '管理者',
};

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
    value: 'role',
    label: '役割',
    required: false,
    autoMapKeywords: ['役割', 'role', '権限'],
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
  {
    key: 'role',
    label: '役割',
    render: (row) => (row.role ? ROLE_LABEL[row.role] || row.role : '-'),
  },
  { key: 'department', label: '部署', render: (row) => row.department || '-' },
];

export default function ImportMembersModal({
  isOpen,
  onClose,
  onImported,
}: ImportMembersModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);

  const handleOpen = () => {
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
    const roleHeader = Object.keys(mapping).find((k) => mapping[k] === 'role');
    const deptHeader = Object.keys(mapping).find(
      (k) => mapping[k] === 'department',
    );

    return rows.map((row) => {
      const name = nameHeader ? row[nameHeader] : '';
      const email = emailHeader ? row[emailHeader] : '';
      const password = passwordHeader ? row[passwordHeader] : '';
      const rawRole = roleHeader ? row[roleHeader] : '';
      const dept = deptHeader ? row[deptHeader] : '';

      const role = ROLE_MAP[rawRole] || (rawRole ? rawRole : 'USER');

      const errors: string[] = [];
      if (!name) errors.push('名前が未入力');
      if (!email) errors.push('メールが未入力');
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        errors.push('メール形式が不正');
      if (!password) errors.push('パスワードが未入力');
      if (password && password.length < 8) errors.push('パスワードは8文字以上');
      if (role && !['USER', 'ADMIN'].includes(role))
        errors.push(`役割「${rawRole}」は不明`);

      return {
        name,
        email,
        password,
        role: ['USER', 'ADMIN'].includes(role) ? role : 'USER',
        department: dept,
        error: errors.length > 0 ? errors.join(', ') : undefined,
      } as MappedRow;
    });
  };

  const handleImport = async (validRows: MappedRow[]) => {
    const payload = validRows.map((m) => {
      const dept = departments.find((d) => d.name === m.department);
      return {
        name: m.name,
        email: m.email,
        password: m.password,
        role: m.role,
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

  return (
    <ImportModal
      isOpen={isOpen}
      onClose={onClose}
      onImported={onImported}
      titlePrefix="メンバー"
      fields={FIELDS}
      previewColumns={PREVIEW_COLUMNS}
      buildMappedData={buildMappedData}
      onImport={handleImport}
      onOpen={handleOpen}
    />
  );
}

'use client';

import Button from '@/components/common/Button';

interface SalesInputButtonProps {
  onClick?: () => void;
}

export default function SalesInputButton({ onClick }: SalesInputButtonProps) {
  return (
    <Button
      icon={
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      }
      label="データ入力"
      color="red"
      onClick={onClick}
    />
  );
}

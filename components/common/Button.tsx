'use client';

import React from 'react';

type ButtonColor = 'blue' | 'red' | 'indigo' | 'green' | 'gray';
type ButtonVariant = 'solid' | 'outline' | 'ghost';
type ButtonSize = 'md' | 'sm' | 'icon';

interface ButtonProps {
  label?: string;
  onClick?: () => void;
  color?: ButtonColor;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  disabled?: boolean;
  title?: string;
  className?: string;
  isActive?: boolean;
  'aria-label'?: string;
  type?: 'button' | 'submit';
}

const SOLID_CLASSES: Record<ButtonColor, string> = {
  blue: 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
  red: 'bg-red-500 border-red-500 text-white hover:bg-red-600 disabled:bg-red-300',
  indigo:
    'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300',
  green:
    'bg-green-600 border-green-600 text-white hover:bg-green-700 disabled:bg-green-300',
  gray: 'bg-gray-600 border-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-300',
};

const OUTLINE_CLASSES: Record<ButtonColor, string> = {
  blue: 'border-blue-300 text-blue-600 hover:bg-blue-50',
  red: 'border-red-300 text-red-600 hover:bg-red-50',
  indigo: 'border-indigo-300 text-indigo-600 hover:bg-indigo-50',
  green: 'border-green-300 text-green-600 hover:bg-green-50',
  gray: 'border-gray-300 text-gray-700 hover:bg-gray-50',
};

/**
 * ghost: 罫線・背景なしのフラットなボタン。
 * segmented control のセルや、ツールバー内アイコンボタンに使う。
 * isActive=true で白背景＋シャドウ + 色付きテキストで「選択中」を表現する。
 */
const GHOST_CLASSES: Record<ButtonColor, { idle: string; active: string }> = {
  blue: {
    idle: 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100',
    active:
      'border-transparent bg-white text-blue-600 font-semibold shadow-sm ring-1 ring-blue-100',
  },
  red: {
    idle: 'border-transparent text-gray-600 hover:text-red-700 hover:bg-red-50',
    active:
      'border-transparent bg-white text-red-600 font-semibold shadow-sm ring-1 ring-red-100',
  },
  indigo: {
    idle: 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100',
    active:
      'border-transparent bg-white text-indigo-600 font-semibold shadow-sm ring-1 ring-indigo-100',
  },
  green: {
    idle: 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100',
    active:
      'border-transparent bg-white text-green-600 font-semibold shadow-sm ring-1 ring-green-100',
  },
  gray: {
    idle: 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100',
    active:
      'border-transparent bg-white text-gray-900 font-semibold shadow-sm ring-1 ring-gray-200',
  },
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: 'px-4 py-2 text-sm rounded-lg',
  sm: 'px-3 py-1.5 text-xs rounded-md',
  icon: 'p-1.5 rounded-md',
};

export default function Button({
  label,
  onClick,
  color = 'blue',
  variant = 'solid',
  size = 'md',
  icon,
  disabled,
  title,
  className = '',
  isActive = false,
  type = 'button',
  ...rest
}: ButtonProps) {
  let colorClass: string;
  if (variant === 'solid') {
    colorClass = SOLID_CLASSES[color];
  } else if (variant === 'outline') {
    colorClass = OUTLINE_CLASSES[color];
  } else {
    colorClass = isActive
      ? GHOST_CLASSES[color].active
      : GHOST_CLASSES[color].idle;
  }

  const sizeClass = SIZE_CLASSES[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={rest['aria-label']}
      className={`inline-flex items-center justify-center whitespace-nowrap font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizeClass} ${colorClass} ${className}`}
    >
      {icon && (
        <span
          className={`${size === 'icon' ? '' : 'w-4 h-4 mr-1.5'} inline-flex items-center justify-center`}
        >
          {icon}
        </span>
      )}
      {label}
    </button>
  );
}

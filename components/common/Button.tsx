'use client';

import React from 'react';

type ButtonColor = 'blue' | 'red' | 'indigo' | 'green' | 'gray';
type ButtonVariant = 'solid' | 'outline';

interface ButtonProps {
  label: string;
  onClick?: () => void;
  color?: ButtonColor;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  disabled?: boolean;
  title?: string;
  className?: string;
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

export default function Button({
  label,
  onClick,
  color = 'blue',
  variant = 'solid',
  icon,
  disabled,
  title,
  className = '',
}: ButtonProps) {
  const colorClass =
    variant === 'solid' ? SOLID_CLASSES[color] : OUTLINE_CLASSES[color];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center px-4 py-2 text-sm font-medium border rounded-lg transition-colors disabled:opacity-50 ${colorClass} ${className}`}
    >
      {icon && <span className="w-5 h-5 mr-1.5">{icon}</span>}
      {label}
    </button>
  );
}

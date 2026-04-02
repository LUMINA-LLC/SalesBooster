'use client';

import React, { useState } from 'react';
import Header from '@/components/header/Header';
import GuideTab from '@/components/help/GuideTab';
import FaqTab from '@/components/help/FaqTab';
import ContactTab from '@/components/help/ContactTab';

type Tab = 'guide' | 'faq' | 'contact';

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'guide',
    label: '操作ガイド',
    icon: (
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
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    key: 'faq',
    label: 'よくある質問',
    icon: (
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
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    key: 'contact',
    label: 'お問い合わせ',
    icon: (
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
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
];

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<Tab>('guide');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header subtitle="ヘルプ" />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">ヘルプセンター</h1>
          <p className="text-sm text-gray-500 mt-1">
            Miroku の使い方やよくある質問を確認できます
          </p>
        </div>

        {/* タブ */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* タブコンテンツ */}
        {activeTab === 'guide' && <GuideTab />}
        {activeTab === 'faq' && <FaqTab />}
        {activeTab === 'contact' && <ContactTab />}
      </div>
    </div>
  );
}

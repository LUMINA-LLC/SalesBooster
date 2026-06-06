'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import LoginLayout from '@/components/login/LoginLayout';
import LoginCredentialsForm from '@/components/login/LoginCredentialsForm';

export default function TenantLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [tenantName, setTenantName] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/auth/tenant/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setTenantName(data.name);
      })
      .catch(() => setNotFound(true))
      .finally(() => setInitialLoading(false));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        accountCode: slug,
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('アカウント/ID/パスワードが正しくありません');
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('ログイン処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginLayout>
      {initialLoading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="mt-3 text-sm text-gray-500">確認中...</p>
        </div>
      ) : notFound ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <svg
            className="mx-auto mb-3 h-12 w-12 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mb-1 font-medium text-gray-600">
            会社アカウントが見つかりません
          </p>
          <p className="mb-4 text-sm text-gray-400">
            URLを確認するか、会社アカウントを入力してログインしてください
          </p>
          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            ログインページへ
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <LoginCredentialsForm
            tenantName={tenantName}
            email={email}
            password={password}
            showPassword={showPassword}
            isLoading={isLoading}
            error={error}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onToggleShowPassword={() => setShowPassword(!showPassword)}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </LoginLayout>
  );
}

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import LoginLayout from '@/components/login/LoginLayout';
import LoginCredentialsForm from '@/components/login/LoginCredentialsForm';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // IPロック中は "LOCKED:<残り分>" 形式のエラーが返る
        const lockMatch = result.error.match(/LOCKED:(\d+)/);
        if (lockMatch) {
          setError(
            `ログイン試行回数が上限に達しました。約${lockMatch[1]}分後に再試行してください。`,
          );
        } else {
          setError('ID/パスワードが正しくありません');
        }
      } else {
        window.location.href = '/admin';
      }
    } catch {
      setError('ログイン処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginLayout variant="admin" subtitle="管理者ログイン">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <LoginCredentialsForm
          variant="admin"
          emailLabel="メールアドレス"
          emailPlaceholder="admin@example.com"
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
    </LoginLayout>
  );
}

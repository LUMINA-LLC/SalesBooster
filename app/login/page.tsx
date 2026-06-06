'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import LoginLayout from '@/components/login/LoginLayout';
import LoginCredentialsForm from '@/components/login/LoginCredentialsForm';

type Step = 'account' | 'credentials';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('account');
  const [accountCode, setAccountCode] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const code = accountCode.trim().toLowerCase();
    if (!/^[a-z0-9]+$/.test(code) || code.length < 5) {
      setError('半角英数字5文字以上で入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/auth/tenant/${code}`);
      if (!res.ok) {
        setError('会社アカウントが見つかりません');
        return;
      }
      const data = await res.json();
      setTenantName(data.name);
      setAccountCode(code);
      setStep('credentials');
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        accountCode,
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

  const handleBack = () => {
    setError('');
    setEmail('');
    setPassword('');
    setTenantName('');
    setStep('account');
  };

  const stepIndex = step === 'account' ? 0 : 1;

  return (
    <LoginLayout>
      {/* ステップインジケーター */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {['会社', 'ログイン'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                i < stepIndex
                  ? 'bg-blue-600 text-white'
                  : i === stepIndex
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                    : 'bg-white/30 text-white'
              }`}
            >
              {i < stepIndex ? (
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            {i < 1 && (
              <div
                className={`h-0.5 w-8 ${i < stepIndex ? 'bg-blue-600' : 'bg-white/30'}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Step 1: 会社アカウント */}
        {step === 'account' && (
          <>
            {error && (
              <div className="mb-5 flex items-center rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <svg
                  className="mr-2 h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleAccountSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  会社アカウント
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={accountCode}
                    onChange={(e) =>
                      setAccountCode(e.target.value.toLowerCase())
                    }
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="半角英数字5文字以上"
                    required
                    autoFocus
                    pattern="[a-z0-9]{5,}"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  管理者から通知された会社アカウントを入力してください
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || accountCode.trim().length < 5}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    確認中...
                  </>
                ) : (
                  <>
                    次へ
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* Step 2: 個人ID + パスワード */}
        {step === 'credentials' && (
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
            onSubmit={handleCredentialsSubmit}
            onBack={handleBack}
          />
        )}
      </div>
    </LoginLayout>
  );
}

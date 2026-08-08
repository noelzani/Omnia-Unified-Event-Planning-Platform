import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Building2, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { signIn } from '../../../services/authService';

export default function ProviderLogin() {
  const navigate = useNavigate();
  const { user, appUser, loading, signOut } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [businessEmail, setBusinessEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (user && appUser) {
      if (appUser.role_id === 5) {
        navigate('/provider/dashboard', { replace: true });
      } else {
        setErrorMessage('This account is not registered as a provider.');
        void signOut();
        setIsSubmitting(false);
      }
    }
  }, [user, appUser, loading, navigate, signOut]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await signIn(businessEmail.trim(), password);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while signing you in.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#fdf7f8_0%,#fffaf8_52%,#fcf5f3_100%)] p-4">
      <div className="absolute left-[-80px] top-[80px] h-72 w-72 rounded-full bg-[#EABAB0]/40 blur-3xl pointer-events-none" />
      <div className="absolute right-[-60px] top-[100px] h-80 w-80 rounded-full bg-[#875A6B]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-60px] left-1/3 h-72 w-72 rounded-full bg-[#EABAB0]/30 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-6 inline-flex size-20 items-center justify-center rounded-2xl bg-[#875A6B] shadow-lg shadow-[#875A6B]/30">
            <Building2 className="size-10 text-white" />
          </div>

          <h1 className="mb-2 text-4xl font-bold text-[#111827]">Provider Portal</h1>
          <p className="text-lg text-[#875A6B]">Sign in to manage your business</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl border border-[#EABAB0]/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Business Email Address
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(event) => setBusinessEmail(event.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-lg border-2 border-gray-200 py-3 pl-12 pr-4 transition-all focus:border-[#875A6B]/45 focus:ring-2 focus:ring-[#EABAB0]/50"
                  placeholder="your.business@company.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Password
              </label>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-lg border-2 border-gray-200 py-3 pl-12 pr-12 transition-all focus:border-[#875A6B]/45 focus:ring-2 focus:ring-[#EABAB0]/50"
                  placeholder="Enter your password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end text-sm">
            <Link
              to="/forgot-password"
              state={{ isProvider: true }}
              className="font-semibold text-[#875A6B] hover:text-[#6f4958]"
            >
              Forgot password?
            </Link>
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-[#EABAB0]/55 bg-[#fcf5f3] px-4 py-3 text-sm text-[#875A6B]">
                {errorMessage}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#875A6B] py-6 text-lg font-semibold text-white shadow-lg shadow-[#875A6B]/25 hover:bg-[#6f4958] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In to Portal'}
              {!isSubmitting && <ArrowRight className="ml-2 size-5" />}
            </Button>
          </form>

        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-[#875A6B]/70 hover:text-[#875A6B]"
          >
            ← Back to Main Site
          </button>
        </div>
      </div>
    </div>
  );
}
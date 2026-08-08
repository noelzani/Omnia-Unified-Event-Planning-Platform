import { useState, type FormEvent } from 'react';
import { CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { supabase } from '../../../lib/supabase';

interface ProviderForm {
  email: string;
  password: string;
  name: string;
  surname: string;
  phone: string;
}

const empty: ProviderForm = {
  email: '',
  password: '',
  name: '',
  surname: '',
  phone: '',
};

const inputCls =
  'w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#875A6B]/50 focus:ring-2 focus:ring-[#875A6B]/20 disabled:bg-slate-50';

const labelCls = 'block text-sm font-semibold text-slate-700 mb-1';

export default function AdminAddProvider() {
  const [form, setForm] = useState<ProviderForm>(empty);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    const { data, error: fnError } = await supabase.functions.invoke(
      'create-provider',
      {
        body: {
          email: form.email,
          password: form.password,
          name: form.name || null,
          surname: form.surname || null,
          phone: form.phone || null,
        },
      }
    );

    setSaving(false);

    if (fnError) {
      setError(data?.error || fnError.message);
      return;
    }

    if (data?.error) {
      setError(data.error);
      return;
    }

    setSuccess(true);
    setForm(empty);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Add Provider</h1>
          <p className="mt-2 text-slate-500">
            Create a new provider account. They can add business/service details later.
          </p>
        </div>

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-green-700">
            <CheckCircle className="size-5 shrink-0" />
            Provider account created successfully.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-5 rounded-3xl border bg-white p-8 shadow-sm"
        >
          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Account Credentials
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={labelCls}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="provider@email.com"
                  className={inputCls}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelCls}>
                  Password <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    className={`${inputCls} pr-12`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#875A6B]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Personal Information
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelCls}>First Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="First name"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Last Name</label>
                <input
                  type="text"
                  name="surname"
                  value={form.surname}
                  onChange={handleChange}
                  placeholder="Last name"
                  className={inputCls}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelCls}>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-[#875A6B] to-[#EABAB0] px-8 text-white hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create Provider'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  User,
  Mail,
  Phone,
  Edit2,
  Save,
  Loader2,
  ShieldCheck,
  KeyRound,
  LockKeyhole,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { supabase } from '../../../lib/supabase';

interface ProfileData {
  user_id: string;
  name: string;
  surname: string;
  phone: string;
  created_at: string | null;
  email: string;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#875A6B]/50 focus:ring-2 focus:ring-[#875A6B]/20 disabled:bg-slate-50 disabled:text-slate-600';
const labelCls = 'block text-sm font-semibold text-slate-700 mb-1';
const pwInputCls = 'h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm outline-none transition focus:border-[#875A6B]/50 focus:ring-2 focus:ring-[#875A6B]/20 disabled:bg-slate-50';

const initialPasswordState = { oldPassword: '', newPassword: '', confirmPassword: '' };

function checkRequirements(pw: string) {
  return {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

export default function AdminProfile() {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [profileData, setProfileData] = useState<ProfileData>({
    user_id: '',
    name: '',
    surname: '',
    phone: '',
    created_at: null,
    email: '',
  });

  const [original, setOriginal] = useState<ProfileData | null>(null);

  const [passwordState, setPasswordState] = useState(initialPasswordState);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const requirements = checkRequirements(passwordState.newPassword);
  const allRequirementsMet = Object.values(requirements).every(Boolean);

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    setIsLoading(true);
    setError('');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      navigate('/admin/login');
      return;
    }

    const { data, error: dbError } = await supabase
      .from('users')
      .select('user_id, name, surname, phone, created_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (dbError) {
      setError(dbError.message);
      setIsLoading(false);
      return;
    }

    const loaded: ProfileData = {
      user_id: user.id,
      email: user.email ?? '',
      name: data?.name ?? '',
      surname: data?.surname ?? '',
      phone: data?.phone ?? '',
      created_at: data?.created_at ?? null,
    };

    setProfileData(loaded);
    setOriginal(loaded);
    setIsLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave() {
    setIsSaving(true);
    setError('');

    const { error: updateError } = await supabase
      .from('users')
      .update({
        name: profileData.name,
        surname: profileData.surname || null,
        phone: profileData.phone || null,
      })
      .eq('user_id', profileData.user_id);

    setIsSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setOriginal(profileData);
    setIsEditing(false);
  }

  function handleCancel() {
    if (original) setProfileData(original);
    setIsEditing(false);
  }

  async function handleChangePassword() {
    if (!profileData.email) return;
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordState.oldPassword) { setPasswordError('Please enter your current password.'); return; }
    if (!passwordState.newPassword) { setPasswordError('Please enter a new password.'); return; }
    if (!allRequirementsMet) { setPasswordError('New password does not meet all requirements.'); return; }
    if (passwordState.newPassword !== passwordState.confirmPassword) { setPasswordError('Passwords do not match.'); return; }
    if (passwordState.oldPassword === passwordState.newPassword) { setPasswordError('New password must differ from current password.'); return; }

    try {
      setIsSavingPassword(true);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password: passwordState.oldPassword,
      });
      if (signInError) { setPasswordError('Current password is incorrect.'); return; }

      const { error: updateError } = await supabase.auth.updateUser({ password: passwordState.newPassword });
      if (updateError) throw updateError;

      setPasswordState(initialPasswordState);
      setPasswordSuccess('Password changed successfully.');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="size-10 animate-spin text-[#875A6B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Admin Profile</h1>
          <p className="mt-2 text-slate-500">Manage your account information.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-3xl border bg-white p-8 shadow-sm">

          {/* Header */}
          <div className="mb-8 flex items-center gap-5">
            <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[#875A6B] to-[#EABAB0]">
              <ShieldCheck className="size-10 text-white" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {profileData.name || 'Admin'} {profileData.surname}
              </h2>
              <p className="text-slate-500">{profileData.email}</p>
            </div>
          </div>

          {/* Edit / Save toolbar */}
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <h3 className="text-lg font-semibold text-slate-800">Account Details</h3>

            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="gap-2 border-[#875A6B]/30 text-[#875A6B] hover:bg-[#875A6B]/5"
              >
                <Edit2 className="size-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleCancel} variant="outline">
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="gap-2 bg-gradient-to-r from-[#875A6B] to-[#EABAB0] text-white hover:opacity-90"
                >
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          {/* Fields */}
          <div className="grid gap-5 md:grid-cols-2">

            <div>
              <label className={labelCls}>
                <User className="mr-1 inline size-4" />
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="First name"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                <User className="mr-1 inline size-4" />
                Last Name
              </label>
              <input
                type="text"
                name="surname"
                value={profileData.surname}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Last name"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                <Phone className="mr-1 inline size-4" />
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Phone number"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                <Mail className="mr-1 inline size-4" />
                Email
              </label>
              <div className="flex h-[46px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 cursor-not-allowed">
                <Mail className="size-3.5 shrink-0" />
                {profileData.email}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Member Since</label>
              <input
                type="text"
                value={
                  profileData.created_at
                    ? new Date(profileData.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '—'
                }
                disabled
                className={inputCls}
              />
            </div>

          </div>
        </div>

        {/* Change Password */}
        <div className="mt-6 rounded-3xl border bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b pb-4">
            <KeyRound className="size-5 text-[#875A6B]" />
            <h3 className="text-lg font-semibold text-slate-800">Change Password</h3>
          </div>

          {passwordError && (
            <div className="mb-4 rounded-xl border border-[#EABAB0]/50 bg-[#EABAB0]/15 px-4 py-3 text-sm text-[#875A6B]">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {passwordSuccess}
            </div>
          )}

          <div className="mb-5 max-w-sm">
            <label className={labelCls}>Current Password</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type={showOld ? 'text' : 'password'}
                value={passwordState.oldPassword}
                onChange={(e) => setPasswordState((p) => ({ ...p, oldPassword: e.target.value }))}
                disabled={isSavingPassword}
                className={pwInputCls}
                placeholder="Current password"
              />
              <button type="button" onClick={() => setShowOld((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#875A6B]">
                {showOld ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelCls}>New Password</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={passwordState.newPassword}
                  onChange={(e) => setPasswordState((p) => ({ ...p, newPassword: e.target.value }))}
                  disabled={isSavingPassword}
                  className={pwInputCls}
                  placeholder="New password"
                />
                <button type="button" onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#875A6B]">
                  {showNew ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Confirm New Password</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={passwordState.confirmPassword}
                  onChange={(e) => setPasswordState((p) => ({ ...p, confirmPassword: e.target.value }))}
                  disabled={isSavingPassword}
                  className={pwInputCls}
                  placeholder="Repeat new password"
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#875A6B]">
                  {showConfirm ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {passwordState.newPassword.length > 0 && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Requirements</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  { key: 'length', label: 'At least 8 characters' },
                  { key: 'uppercase', label: 'One uppercase letter' },
                  { key: 'lowercase', label: 'One lowercase letter' },
                  { key: 'number', label: 'One number' },
                  { key: 'special', label: 'One special character' },
                ].map(({ key, label }) => {
                  const met = requirements[key as keyof typeof requirements];
                  return (
                    <div key={key} className="flex items-center gap-2">
                      {met ? <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" /> : <X className="size-3.5 shrink-0 text-slate-300" />}
                      <span className={`text-xs ${met ? 'text-emerald-600' : 'text-slate-400'}`}>{label}</span>
                    </div>
                  );
                })}
                {passwordState.confirmPassword.length > 0 && (
                  <div className="flex items-center gap-2">
                    {passwordState.newPassword === passwordState.confirmPassword
                      ? <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                      : <X className="size-3.5 shrink-0 text-slate-300" />}
                    <span className={`text-xs ${passwordState.newPassword === passwordState.confirmPassword ? 'text-emerald-600' : 'text-slate-400'}`}>
                      Passwords match
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button
            type="button"
            onClick={() => void handleChangePassword()}
            disabled={isSavingPassword}
            className="mt-5 gap-2 bg-gradient-to-r from-[#875A6B] to-[#EABAB0] text-white hover:opacity-90"
          >
            {isSavingPassword ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            {isSavingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </div>
    </div>
  );
}

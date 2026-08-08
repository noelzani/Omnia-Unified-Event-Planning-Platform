import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Building2,
  Mail,
  MapPin,
  Save,
  Edit2,
  Loader2,
  KeyRound,
  LockKeyhole,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  TrendingUp,
  Hash,
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { supabase } from '../../../lib/supabase';

interface ProviderData {
  provider_id?: number;
  business_name: string;
  business_description: string;
  business_address: string;
  city: string;
  registration_number: string;
  average_rating: number | null;
  status: string | null;
}

interface Stats {
  venues: number;
  restaurants: number;
  catering: number;
  decor: number;
}

const initialPasswordState = { oldPassword: '', newPassword: '', confirmPassword: '' };

function checkRequirements(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

const fieldClass = 'space-y-1.5';
const labelClass = 'text-xs font-semibold uppercase tracking-wide text-[#875A6B]/70';
const inputCls = 'h-10 w-full rounded-lg border border-[#EABAB0]/50 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#875A6B]/50 focus:ring-2 focus:ring-[#EABAB0]/30 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed';
const pwInputCls = 'h-10 w-full rounded-lg border border-[#EABAB0]/50 bg-white pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-[#875A6B]/50 focus:ring-2 focus:ring-[#EABAB0]/30 disabled:bg-slate-50';

export default function ProviderProfile() {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [email, setEmail] = useState('');

  const [providerData, setProviderData] = useState<ProviderData>({
    business_name: '',
    business_description: '',
    business_address: '',
    city: '',
    registration_number: '',
    average_rating: null,
    status: null,
  });
  const [originalData, setOriginalData] = useState<ProviderData | null>(null);

  const [stats, setStats] = useState<Stats>({ venues: 0, restaurants: 0, catering: 0, decor: 0 });

  const [passwordState, setPasswordState] = useState(initialPasswordState);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const requirements = checkRequirements(passwordState.newPassword);
  const allRequirementsMet = Object.values(requirements).every(Boolean);

  useEffect(() => { void loadProfile(); }, []);

  async function loadProfile() {
    setIsLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) { navigate('/provider/login'); return; }

    setEmail(user.email ?? '');

    const { data: provider, error } = await supabase
      .from('providers')
      .select('provider_id, business_name, business_description, business_address, city, registration_number, average_rating, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) { console.error(error); setIsLoading(false); return; }

    if (provider) {
      const loaded: ProviderData = {
        provider_id: provider.provider_id,
        business_name: provider.business_name ?? '',
        business_description: provider.business_description ?? '',
        business_address: provider.business_address ?? '',
        city: provider.city ?? '',
        registration_number: provider.registration_number ?? '',
        average_rating: provider.average_rating ?? null,
        status: provider.status ?? null,
      };
      setProviderData(loaded);
      setOriginalData(loaded);
      await loadStats(provider.provider_id);
    }
    setIsLoading(false);
  }

  async function loadStats(providerId: number) {
    const [v, r, c, d] = await Promise.all([
      supabase.from('venues').select('venue_id', { count: 'exact', head: true }).eq('provider_id', providerId),
      supabase.from('restaurants').select('restaurant_id', { count: 'exact', head: true }).eq('provider_id', providerId),
      supabase.from('catering_services').select('catering_id', { count: 'exact', head: true }).eq('provider_id', providerId),
      supabase.from('decoration_services').select('decoration_id', { count: 'exact', head: true }).eq('provider_id', providerId),
    ]);
    setStats({ venues: v.count ?? 0, restaurants: r.count ?? 0, catering: c.count ?? 0, decor: d.count ?? 0 });
  }

  async function handleSave() {
    if (!providerData.provider_id) return;
    setSaveError('');
    setSaveSuccess('');
    setIsSaving(true);

    const { error } = await supabase
      .from('providers')
      .update({
        business_name: providerData.business_name,
        business_description: providerData.business_description || null,
        business_address: providerData.business_address || null,
        city: providerData.city || null,
        registration_number: providerData.registration_number || null,
      })
      .eq('provider_id', providerData.provider_id);

    setIsSaving(false);

    if (error) { setSaveError(error.message); return; }

    setOriginalData(providerData);
    setIsEditing(false);
    setSaveSuccess('Profile updated successfully.');
  }

  function handleCancel() {
    if (originalData) setProviderData(originalData);
    setIsEditing(false);
    setSaveError('');
  }

  async function handleChangePassword() {
    if (!email) return;
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordState.oldPassword) { setPasswordError('Please enter your current password.'); return; }
    if (!passwordState.newPassword) { setPasswordError('Please enter a new password.'); return; }
    if (!allRequirementsMet) { setPasswordError('New password does not meet all requirements.'); return; }
    if (passwordState.newPassword !== passwordState.confirmPassword) { setPasswordError('Passwords do not match.'); return; }
    if (passwordState.oldPassword === passwordState.newPassword) { setPasswordError('New password must differ from current password.'); return; }

    try {
      setIsSavingPassword(true);
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: passwordState.oldPassword });
      if (signInError) { setPasswordError('Current password is incorrect.'); return; }

      const { error: updateError } = await supabase.auth.updateUser({ password: passwordState.newPassword });
      if (updateError) throw updateError;

      setPasswordState(initialPasswordState);
      setPasswordSuccess('Password changed successfully.');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Could not update password.');
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf7f8]">
        <Loader2 className="size-8 animate-spin text-[#875A6B]" />
      </div>
    );
  }

  const totalProperties = stats.venues + stats.restaurants + stats.catering + stats.decor;

  return (
    <div className="min-h-screen bg-[#fdf7f8]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left sidebar */}
          <div className="lg:col-span-1 space-y-5">
            {/* Business card */}
            <div className="rounded-2xl border border-[#EABAB0]/30 bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-2xl bg-[#EABAB0]/30">
                <Building2 className="size-10 text-[#875A6B]" />
              </div>
              <h2 className="text-lg font-bold text-[#111827]">
                {providerData.business_name || 'Your Business'}
              </h2>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-slate-400">
                <Mail className="size-3" />
                <span className="truncate">{email}</span>
              </div>
              {providerData.city && (
                <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="size-3" />
                  {providerData.city}
                </div>
              )}
              {providerData.status && (
                <span className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  providerData.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : providerData.status === 'Suspended' ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {providerData.status}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="rounded-2xl border border-[#EABAB0]/30 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="size-4 text-[#875A6B]" />
                <h3 className="text-sm font-semibold text-[#111827]">Property Stats</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Venues', count: stats.venues },
                  { label: 'Restaurants', count: stats.restaurants },
                  { label: 'Catering', count: stats.catering },
                  { label: 'Decor', count: stats.decor },
                ].map(({ label, count }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="text-sm font-bold text-[#875A6B]">{count}</span>
                  </div>
                ))}
                <div className="border-t border-[#EABAB0]/30 pt-2.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Total</span>
                  <span className="text-sm font-bold text-[#875A6B]">{totalProperties}</span>
                </div>
              </div>
              {providerData.average_rating != null && (
                <div className="mt-4 rounded-xl bg-[#fdf7f8] border border-[#EABAB0]/25 px-4 py-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#875A6B]/60 mb-1">Avg Rating</p>
                  <p className="text-2xl font-bold text-[#875A6B]">
                    {Number(providerData.average_rating).toFixed(1)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Business Info */}
            <div className="rounded-2xl border border-[#EABAB0]/30 bg-white p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-[#875A6B]" />
                  <h2 className="text-base font-semibold text-[#111827]">Business Information</h2>
                </div>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="gap-2 border-[#875A6B]/30 text-[#875A6B] hover:bg-[#875A6B]/5"
                    size="sm"
                  >
                    <Edit2 className="size-3.5" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleCancel} variant="outline" size="sm">Cancel</Button>
                    <Button
                      onClick={() => void handleSave()}
                      disabled={isSaving}
                      size="sm"
                      className="gap-1.5 bg-[#875A6B] text-white hover:bg-[#6f4958]"
                    >
                      {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>

              {saveError && (
                <div className="mb-4 rounded-xl border border-[#EABAB0]/50 bg-[#EABAB0]/15 px-4 py-3 text-sm text-[#875A6B]">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {saveSuccess}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className={`${fieldClass} sm:col-span-2`}>
                  <label className={labelClass}>Business Name</label>
                  <input
                    type="text"
                    value={providerData.business_name}
                    onChange={(e) => setProviderData((p) => ({ ...p, business_name: e.target.value }))}
                    disabled={!isEditing}
                    className={inputCls}
                    placeholder="Your business name"
                  />
                </div>

                <div className={fieldClass}>
                  <label className={labelClass}>City</label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={providerData.city}
                      onChange={(e) => setProviderData((p) => ({ ...p, city: e.target.value }))}
                      disabled={!isEditing}
                      className={`${inputCls} pl-9`}
                      placeholder="City"
                    />
                  </div>
                </div>

                <div className={fieldClass}>
                  <label className={labelClass}>Registration Number</label>
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={providerData.registration_number}
                      onChange={(e) => setProviderData((p) => ({ ...p, registration_number: e.target.value }))}
                      disabled={!isEditing}
                      className={`${inputCls} pl-9`}
                      placeholder="Business registration #"
                    />
                  </div>
                </div>

                <div className={`${fieldClass} sm:col-span-2`}>
                  <label className={labelClass}>Business Address</label>
                  <input
                    type="text"
                    value={providerData.business_address}
                    onChange={(e) => setProviderData((p) => ({ ...p, business_address: e.target.value }))}
                    disabled={!isEditing}
                    className={inputCls}
                    placeholder="Full business address"
                  />
                </div>

                <div className={`${fieldClass} sm:col-span-2`}>
                  <label className={labelClass}>Business Description</label>
                  <textarea
                    value={providerData.business_description}
                    onChange={(e) => setProviderData((p) => ({ ...p, business_description: e.target.value }))}
                    disabled={!isEditing}
                    rows={3}
                    className={`${inputCls} h-auto resize-none py-2.5`}
                    placeholder="Describe your business..."
                  />
                </div>

                <div className={`${fieldClass} sm:col-span-2`}>
                  <label className={labelClass}>Email Address</label>
                  <div className="flex h-10 items-center gap-2 rounded-lg border border-[#EABAB0]/30 bg-slate-50 px-3 text-sm text-slate-400 cursor-not-allowed">
                    <Mail className="size-3.5 shrink-0" />
                    {email}
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="rounded-2xl border border-[#EABAB0]/30 bg-white p-6">
              <div className="mb-5 flex items-center gap-2">
                <KeyRound className="size-4 text-[#875A6B]" />
                <h2 className="text-base font-semibold text-[#111827]">Change Password</h2>
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

              <div className={`${fieldClass} mb-4`}>
                <label className={labelClass}>Current Password</label>
                <div className="relative max-w-sm">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={passwordState.oldPassword}
                    onChange={(e) => setPasswordState((p) => ({ ...p, oldPassword: e.target.value }))}
                    disabled={isSavingPassword}
                    className={pwInputCls}
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setShowOld((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#875A6B]">
                    {showOld ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className={fieldClass}>
                  <label className={labelClass}>New Password</label>
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
                <div className={fieldClass}>
                  <label className={labelClass}>Confirm New Password</label>
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
                <div className="mt-4 rounded-xl border border-[#EABAB0]/30 bg-[#fdf7f8] p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#875A6B]/60">
                    Requirements
                  </p>
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
                className="mt-5 bg-[#875A6B] hover:bg-[#6f4958] text-white"
              >
                {isSavingPassword ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                {isSavingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

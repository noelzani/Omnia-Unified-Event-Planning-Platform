import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  User,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import {
  getUserProfile,
  type UserProfileRow,
  upsertUserProfile,
} from '../../services/users/user-profile.service';
import { supabase } from '../../lib/supabase';
import ConfirmModal from '../components/ui/ConfirmModal';

const initialFormState = {
  name: '',
  surname: '',
  phone: '',
  email: '',
  city: '',
};

const initialPasswordState = {
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function checkRequirements(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [passwordState, setPasswordState] = useState(initialPasswordState);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const metadata = (user?.user_metadata as Record<string, unknown> | undefined) ?? {};

  const metadataName =
    typeof metadata.given_name === 'string'
      ? metadata.given_name.trim()
      : typeof metadata.full_name === 'string'
        ? metadata.full_name.trim().split(' ')[0] ?? ''
        : typeof metadata.name === 'string'
          ? metadata.name.trim().split(' ')[0] ?? ''
          : '';

  const metadataSurname =
    typeof metadata.family_name === 'string'
      ? metadata.family_name.trim()
      : typeof metadata.full_name === 'string'
        ? metadata.full_name.trim().split(' ').slice(1).join(' ')
        : typeof metadata.name === 'string'
          ? metadata.name.trim().split(' ').slice(1).join(' ')
          : '';

  const metadataFullName =
    typeof metadata.full_name === 'string'
      ? metadata.full_name.trim()
      : typeof metadata.name === 'string'
        ? metadata.name.trim()
        : [metadataName, metadataSurname].filter(Boolean).join(' ');

  const metadataCity = typeof metadata.city === 'string' ? metadata.city : '';

  const metadataAvatar =
    typeof metadata.avatar_url === 'string'
      ? metadata.avatar_url
      : typeof metadata.picture === 'string'
        ? metadata.picture
        : '';

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }
      try {
        setProfileLoading(true);
        setProfileError('');
        const data = await getUserProfile(user.id);
        setProfile(data);
      } catch (error) {
        console.error('Error loading user profile:', error);
        setProfileError('We could not load your profile right now.');
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    }
    void loadProfile();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setFormState(initialFormState);
      return;
    }
    setFormState({
      name: profile?.name ?? metadataName,
      surname: profile?.surname ?? metadataSurname,
      phone: profile?.phone ?? '',
      email: user.email ?? '',
      city: metadataCity,
    });
  }, [profile, user, metadataName, metadataSurname, metadataCity]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const fullName = useMemo(() => {
    const dbFullName = [profile?.name, profile?.surname].filter(Boolean).join(' ').trim();
    if (dbFullName) return dbFullName;
    if (metadataFullName) return metadataFullName;
    return user?.email ?? 'Profile';
  }, [profile, metadataFullName, user?.email]);

  const initials = useMemo(() => {
    const source = fullName.trim();
    if (!source) return 'U';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }, [fullName]);

  const createdAtLabel =
    profile?.created_at || user?.created_at
      ? new Date(profile?.created_at ?? user!.created_at).toLocaleDateString()
      : 'Not available';

  const requirements = checkRequirements(passwordState.newPassword);
  const allRequirementsMet = Object.values(requirements).every(Boolean);

  async function handleSaveProfile() {
    if (!user) return;
    if (!formState.name.trim()) {
      setSaveError('Name is required.');
      return;
    }
    try {
      setIsSaving(true);
      setSaveError('');
      setSaveSuccess('');

      const nextProfile = await upsertUserProfile({
        userId: user.id,
        name: formState.name,
        surname: formState.surname || null,
        phone: formState.phone || null,
      });

      const authUpdates: { data?: Record<string, string> } = {};

      const currentCity =
        typeof user.user_metadata?.city === 'string' ? user.user_metadata.city : '';

      if (formState.city.trim() !== currentCity) {
        authUpdates.data = {
          ...((user.user_metadata as Record<string, string> | undefined) ?? {}),
          city: formState.city.trim(),
        };
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error } = await supabase.auth.updateUser(authUpdates);
        if (error) throw error;
      }

      setProfile(nextProfile);
      setSaveSuccess('Profile updated successfully.');
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveError(
        error instanceof Error ? error.message : 'We could not save your profile changes.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!user?.email) return;

    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordState.oldPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!passwordState.newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (!allRequirementsMet) {
      setPasswordError('Your new password does not meet all requirements.');
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwordState.oldPassword === passwordState.newPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    try {
      setIsSavingPassword(true);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordState.oldPassword,
      });

      if (signInError) {
        setPasswordError('Current password is incorrect.');
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordState.newPassword,
      });

      if (updateError) throw updateError;

      setPasswordState(initialPasswordState);
      setPasswordSuccess('Password changed successfully.');
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(
        error instanceof Error ? error.message : 'Could not update password.',
      );
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error.message);
        setIsLoggingOut(false);
        return;
      }
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  }

  if (authLoading || profileLoading || isLoggingOut) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#fdf7f8]">
        <Loader2 className="size-7 animate-spin text-[#875A6B]" />
      </div>
    );
  }

  if (!user) return null;

  const fieldClass = 'space-y-1.5';
  const labelClass = 'text-xs font-semibold uppercase tracking-wide text-[#875A6B]/70';
  const inputClass = 'h-10 border-[#EABAB0]/50 bg-white focus-visible:ring-[#EABAB0]/40';

  return (
    <>
    <div className="min-h-screen bg-[#fdf7f8]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {profileError && (
          <div className="mb-5 rounded-xl border border-[#EABAB0]/50 bg-[#EABAB0]/15 px-4 py-3 text-sm text-[#875A6B]">
            {profileError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

          {/* ── Sidebar ── */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-[#EABAB0]/30 bg-white">
              {/* accent top */}
              <div className="h-[3px] bg-gradient-to-r from-[#875A6B] via-[#C9995A] to-[#EABAB0]" />
              <div className="p-6">
                {/* Avatar */}
                <div className="flex flex-col items-center text-center">
                  {metadataAvatar ? (
                    <img
                      src={metadataAvatar}
                      alt="avatar"
                      className="mb-4 size-20 rounded-full object-cover shadow-lg shadow-[#875A6B]/20"
                    />
                  ) : (
                    <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[#875A6B] to-[#5C3347] text-2xl font-bold text-white shadow-lg shadow-[#875A6B]/25">
                      {initials}
                    </div>
                  )}
                  <h2 className="font-bold text-slate-900">{fullName}</h2>
                  <p className="mt-0.5 text-xs text-slate-400 break-all">{user?.email}</p>
                </div>

                {/* Stats */}
                <div className="mt-5 space-y-2">
                  <div className="rounded-xl border border-[#EABAB0]/30 bg-[#fdf7f8] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#875A6B]/60">Member Since</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-700">{createdAtLabel}</p>
                  </div>
                  {formState.city && (
                    <div className="flex items-center gap-2 rounded-xl border border-[#EABAB0]/30 bg-[#fdf7f8] px-4 py-3">
                      <MapPin className="size-3.5 shrink-0 text-[#875A6B]/50" />
                      <p className="text-sm font-semibold text-slate-700">{formState.city}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sign out */}
            <div className="rounded-2xl border border-[#EABAB0]/30 bg-white p-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Account</p>
              <Button
                type="button"
                onClick={() => setShowSignOutConfirm(true)}
                disabled={isLoggingOut}
                variant="outline"
                className="w-full gap-2 border-[#EABAB0]/60 text-[#875A6B] hover:bg-[#fdf7f8] hover:border-[#875A6B]/40"
              >
                {isLoggingOut
                  ? <Loader2 className="size-4 animate-spin" />
                  : <LogOut className="size-4" />}
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </Button>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="space-y-5">

            {/* Profile form */}
            <div className="rounded-2xl border border-[#EABAB0]/30 bg-white p-6">
              <div className="mb-5 flex items-center gap-2 border-b border-[#EABAB0]/20 pb-4">
                <User className="size-4 text-[#875A6B]" />
                <h2 className="text-base font-semibold text-[#111827]">Personal Information</h2>
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
                <div className={fieldClass}>
                  <Label htmlFor="profile-name" className={labelClass}>First Name</Label>
                  <Input id="profile-name" value={formState.name}
                    onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                    className={inputClass} disabled={isSaving} />
                </div>
                <div className={fieldClass}>
                  <Label htmlFor="profile-surname" className={labelClass}>Last Name</Label>
                  <Input id="profile-surname" value={formState.surname}
                    onChange={(e) => setFormState((p) => ({ ...p, surname: e.target.value }))}
                    className={inputClass} disabled={isSaving} />
                </div>
                <div className={fieldClass}>
                  <Label className={labelClass}>Email Address</Label>
                  <div className="flex h-10 items-center gap-2 rounded-md border border-[#EABAB0]/30 bg-slate-50 px-3 text-sm text-slate-400 cursor-not-allowed">
                    <Mail className="size-3.5 shrink-0" />
                    {formState.email}
                  </div>
                </div>
                <div className={fieldClass}>
                  <Label htmlFor="profile-phone" className={labelClass}>Phone Number</Label>
                  <Input id="profile-phone" value={formState.phone}
                    onChange={(e) => setFormState((p) => ({ ...p, phone: e.target.value }))}
                    className={inputClass} disabled={isSaving} />
                </div>
                <div className={fieldClass}>
                  <Label htmlFor="profile-city" className={labelClass}>City</Label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <Input id="profile-city" value={formState.city}
                      onChange={(e) => setFormState((p) => ({ ...p, city: e.target.value }))}
                      className={`${inputClass} pl-9`} disabled={isSaving} />
                  </div>
                </div>
              </div>

              <Button type="button" onClick={() => void handleSaveProfile()} disabled={isSaving}
                className="mt-5 bg-[#875A6B] hover:bg-[#6f4958] text-white">
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : <PencilLine className="size-4" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            {/* Change Password */}
            <div className="rounded-2xl border border-[#EABAB0]/30 bg-white p-6">
              <div className="mb-5 flex items-center gap-2 border-b border-[#EABAB0]/20 pb-4">
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
                <Label htmlFor="old-password" className={labelClass}>Current Password</Label>
                <div className="relative max-w-sm">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                  <Input id="old-password" type={showOld ? 'text' : 'password'}
                    value={passwordState.oldPassword}
                    onChange={(e) => setPasswordState((p) => ({ ...p, oldPassword: e.target.value }))}
                    className={`${inputClass} pl-9 pr-9`} placeholder="Current password" disabled={isSavingPassword} />
                  <button type="button" onClick={() => setShowOld((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#875A6B]">
                    {showOld ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className={fieldClass}>
                  <Label htmlFor="new-password" className={labelClass}>New Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <Input id="new-password" type={showNew ? 'text' : 'password'}
                      value={passwordState.newPassword}
                      onChange={(e) => setPasswordState((p) => ({ ...p, newPassword: e.target.value }))}
                      className={`${inputClass} pl-9 pr-9`} placeholder="New password" disabled={isSavingPassword} />
                    <button type="button" onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#875A6B]">
                      {showNew ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>
                <div className={fieldClass}>
                  <Label htmlFor="confirm-password" className={labelClass}>Confirm Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <Input id="confirm-password" type={showConfirm ? 'text' : 'password'}
                      value={passwordState.confirmPassword}
                      onChange={(e) => setPasswordState((p) => ({ ...p, confirmPassword: e.target.value }))}
                      className={`${inputClass} pl-9 pr-9`} placeholder="Repeat new password" disabled={isSavingPassword} />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#875A6B]">
                      {showConfirm ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {passwordState.newPassword.length > 0 && (
                <div className="mt-4 rounded-xl border border-[#EABAB0]/30 bg-[#fdf7f8] p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#875A6B]/60">Requirements</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {([
                      { key: 'length', label: 'At least 8 characters' },
                      { key: 'uppercase', label: 'One uppercase letter' },
                      { key: 'lowercase', label: 'One lowercase letter' },
                      { key: 'number', label: 'One number' },
                      { key: 'special', label: 'One special character' },
                    ] as const).map(({ key, label }) => {
                      const met = requirements[key];
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

              <Button type="button" onClick={() => void handleChangePassword()} disabled={isSavingPassword}
                className="mt-5 bg-[#875A6B] hover:bg-[#6f4958] text-white">
                {isSavingPassword ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                {isSavingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>

    <ConfirmModal
      open={showSignOutConfirm}
      variant="brand"
      title="Log out?"
      description="You'll be logged out of your account and returned to the home page."
      confirmLabel="Log Out"
      onCancel={() => setShowSignOutConfirm(false)}
      onConfirm={() => { setShowSignOutConfirm(false); void handleLogout(); }}
      loading={isLoggingOut}
    />
    </>
  );
}

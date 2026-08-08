import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { Check, Eye, EyeOff, KeyRound, Loader2, X } from "lucide-react";
import { supabase } from "../../../lib/supabase";

function checkPasswordRequirements(pw: string) {
  return {
    length:    pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number:    /[0-9]/.test(pw),
    special:   /[^A-Za-z0-9]/.test(pw),
  };
}

const REQUIREMENT_LABELS: Record<keyof ReturnType<typeof checkPasswordRequirements>, string> = {
  length:    "At least 8 characters",
  uppercase: "One uppercase letter",
  lowercase: "One lowercase letter",
  number:    "One number",
  special:   "One special character",
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const isProvider = location.state?.isProvider || false;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const requirements = checkPasswordRequirements(password);
  const allRequirementsMet = Object.values(requirements).every(Boolean);
  const passwordsMatch = password === confirmPassword;

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!password || !confirmPassword) {
      setErrorMessage("Please fill in both password fields.");
      return;
    }

    if (!allRequirementsMet) {
      setPasswordTouched(true);
      setErrorMessage("Please meet all password requirements.");
      return;
    }

    if (!passwordsMatch) {
      setConfirmTouched(true);
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Password changed successfully.");

    setTimeout(() => {
      navigate(isProvider ? "/provider/dashboard" : "/dashboard");
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf7f8] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-[#EABAB0]/50">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EABAB0]/40">
            <KeyRound className="text-[#875A6B]" size={28} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Create New Password
          </h1>

          <p className="mt-2 text-gray-500">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              New password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage("");
                }}
                onBlur={() => setPasswordTouched(true)}
                className={`w-full rounded-xl border px-4 py-3 pr-12 outline-none focus:ring-2 transition ${
                  passwordTouched && password && !allRequirementsMet
                    ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                    : "border-gray-300 focus:ring-[#875A6B]/25 focus:border-[#875A6B]/40"
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Requirements checklist — shown once user starts typing */}
            {(passwordTouched || password.length > 0) && (
              <ul className="mt-3 space-y-1.5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                {(Object.keys(requirements) as Array<keyof typeof requirements>).map((key) => (
                  <li key={key} className="flex items-center gap-2 text-sm">
                    {requirements[key] ? (
                      <Check size={14} className="shrink-0 text-emerald-500" />
                    ) : (
                      <X size={14} className="shrink-0 text-red-400" />
                    )}
                    <span className={requirements[key] ? "text-emerald-700" : "text-gray-500"}>
                      {REQUIREMENT_LABELS[key]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Confirm password
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMessage("");
                }}
                onBlur={() => setConfirmTouched(true)}
                className={`w-full rounded-xl border px-4 py-3 pr-12 outline-none focus:ring-2 transition ${
                  confirmTouched && confirmPassword && !passwordsMatch
                    ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                    : "border-gray-300 focus:ring-[#875A6B]/25 focus:border-[#875A6B]/40"
                }`}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {confirmTouched && confirmPassword && !passwordsMatch && (
              <p className="mt-1.5 text-xs text-red-500">Passwords do not match.</p>
            )}
          </div>

          {errorMessage && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#875A6B] py-3 font-semibold text-white hover:bg-[#6f4958] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Updating...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "../../../lib/supabase";

export default function VerifyResetCode() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const isProvider = location.state?.isProvider || false;

  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email) {
      setErrorMessage("Email is missing. Please start again.");
      return;
    }

    if (!code.trim()) {
      setErrorMessage("Please enter the reset code.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "recovery",
    });

    setLoading(false);

    if (error) {
      setErrorMessage("Invalid or expired code.");
      return;
    }

    navigate("/reset-password", {
      state: {
        isProvider,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf7f8] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-[#EABAB0]/50">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EABAB0]/40">
            <ShieldCheck className="text-[#875A6B]" size={28} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Verify Code</h1>

          <p className="mt-2 text-gray-500">
            Enter the reset code sent to your email.
          </p>
        </div>

        <form onSubmit={handleVerifyCode} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Reset code
            </label>

            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              placeholder="12345678"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-xl border border-[#EABAB0]/60 px-4 py-3 text-center text-2xl tracking-[0.4em] outline-none focus:ring-2 focus:ring-[#875A6B]/25 focus:border-[#875A6B]/40"
            />
          </div>

          {errorMessage && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {errorMessage}
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
                Verifying...
              </>
            ) : (
              <>
                Verify Code
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
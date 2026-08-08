import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Loader2, Mail } from "lucide-react";
import { supabase } from "../../../lib/supabase";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const isProvider = location.state?.isProvider || false;
  const isAdmin = location.state?.isAdmin || false;

  const loginRoute = isAdmin ? "/admin/login" : isProvider ? "/provider-login" : "/login";

  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    navigate("/verify-reset-code", {
      state: {
        email: email.trim(),
        isProvider,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf7f8] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-[#EABAB0]/50">
        <button
          type="button"
          onClick={() => navigate(loginRoute)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EABAB0]/40">
            <Mail className="text-[#875A6B]" size={28} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Forgot Password?
          </h1>

          <p className="mt-2 text-gray-500">
            Enter your email and we will send you a reset code.
          </p>
        </div>

        <form onSubmit={handleSendCode} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email address
            </label>

            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#EABAB0]/60 px-4 py-3 outline-none focus:ring-2 focus:ring-[#875A6B]/25 focus:border-[#875A6B]/40"
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
                Sending...
              </>
            ) : (
              <>
                Send Code
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
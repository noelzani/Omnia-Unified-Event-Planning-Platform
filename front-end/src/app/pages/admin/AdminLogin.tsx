import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useNavigate, Link } from "react-router";
import { signIn, signOut } from "../../../services/authService";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, appUser, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!appUser) return;

    if (appUser.role_id === 6) {
      navigate("/admin", { replace: true });
    } else {
      void signOut();
      setErrorMessage("Access denied. This portal is for administrators only.");
    }
  }, [loading, user, appUser, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signIn(email, password);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while signing you in."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#fdf7f8_0%,#fffaf8_52%,#fcf5f3_100%)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-80px] top-[80px] h-72 w-72 rounded-full bg-[#EABAB0]/40 blur-3xl" />
        <div className="absolute right-[-60px] top-[100px] h-80 w-80 rounded-full bg-[#875A6B]/15 blur-3xl" />
        <div className="absolute bottom-[-60px] left-1/3 h-72 w-72 rounded-full bg-[#EABAB0]/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2.25rem] border border-white/70 bg-white/75 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex flex-col items-center bg-[linear-gradient(135deg,#875A6B,#B98590)] px-10 py-10 text-center">
            <div className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 backdrop-blur-sm">
              <ShieldCheck className="size-8 text-white" />
            </div>
            <p className="text-sm font-medium text-white/80">Restricted access</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">Admin Portal</h1>
          </div>

          <div className="p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-2xl border border-[#EABAB0]/45 bg-white/90 pl-11 pr-4 text-slate-800 shadow-sm outline-none transition focus:border-[#875A6B]/45 focus:ring-4 focus:ring-[#EABAB0]/25 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-2xl border border-[#EABAB0]/45 bg-white/90 pl-11 pr-12 text-slate-800 shadow-sm outline-none transition focus:border-[#875A6B]/45 focus:ring-4 focus:ring-[#EABAB0]/25 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isSubmitting}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#875A6B]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    state={{ isAdmin: true }}
                    className="text-sm text-slate-500 transition hover:text-[#875A6B]"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-[#EABAB0]/55 bg-[#fcf5f3] px-4 py-3 text-sm text-[#875A6B]">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#875A6B_0%,#B98590_55%,#EABAB0_100%)] text-sm font-semibold text-white shadow-lg shadow-[#EABAB0]/45 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
                {!isSubmitting && (
                  <ArrowRight className="size-4" />
                )}
              </button>
            </form>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-sm text-slate-500 transition hover:text-[#875A6B]"
              >
                ← Back to main site
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

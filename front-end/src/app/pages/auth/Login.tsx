import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { getUserRole, signIn, signOut } from "../../../services/authService";
import { useAuth } from "../../context/AuthContext";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
    title: "Create unforgettable celebrations",
    text: "From dreamy venues to elegant decor, plan every detail beautifully.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    title: "Bring your vision to life",
    text: "Discover venues, catering, and styling ideas in one place.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
    title: "Make every event feel special",
    text: "Organize memorable moments with a calm, elegant planning experience.",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { signInWithGoogle, user, appUser, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showProviderLoginLink, setShowProviderLoginLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (loading || !user || !appUser) return;

    if (appUser.role_id === 5) {
      void signOut();
      setErrorMessage(
        "You are a provider. You cannot log in here. Please log in from the provider login page."
      );
      setShowProviderLoginLink(true);
      return;
    }

    if (appUser.role_id === 4) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, appUser, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setShowProviderLoginLink(false);
    setIsSubmitting(true);

    try {
      const data = await signIn(email, password);

      if (!data.user) {
        setErrorMessage("Invalid email or password.");
        return;
      }

      const roleId = await getUserRole(data.user.id);

      if (roleId === 5) {
        await signOut();
        setErrorMessage(
          "You are a provider. You cannot log in here. Please log in from the provider login page."
        );
        setShowProviderLoginLink(true);
        return;
      }

      if (roleId !== 4) {
        await signOut();
        setErrorMessage("This account cannot log in from the customer login page.");
        return;
      }

      navigate("/dashboard", { replace: true });
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

  const handleGoogleSignIn = async () => {
    try {
      setErrorMessage("");
      setShowProviderLoginLink(false);
      setIsGoogleSubmitting(true);
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while signing you in with Google."
      );
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#fdf7f8_0%,#fffaf8_52%,#fcf5f3_100%)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-80px] top-[80px] h-72 w-72 rounded-full bg-[#EABAB0]/40 blur-3xl" />
        <div className="absolute right-[-60px] top-[100px] h-80 w-80 rounded-full bg-[#875A6B]/15 blur-3xl" />
        <div className="absolute bottom-[-60px] left-1/3 h-72 w-72 rounded-full bg-[#EABAB0]/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2.25rem] border border-white/70 bg-white/75 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl md:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[480px] overflow-hidden">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-1000 ${
                  index === currentSlide
                    ? "opacity-100 scale-100"
                    : "pointer-events-none opacity-0 scale-105"
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,250,248,0.10),rgba(53,35,44,0.34))]" />
              </div>
            ))}

            <div className="absolute bottom-8 left-8 right-8 rounded-[1.75rem] border border-white/30 bg-white/20 p-6 text-white backdrop-blur-md">
              <h2 className="text-3xl font-semibold leading-tight">
                {slides[currentSlide].title}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/90">
                {slides[currentSlide].text}
              </p>

              <div className="mt-5 flex gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      currentSlide === index
                        ? "w-8 bg-white"
                        : "w-2.5 bg-white/50 hover:bg-white/80"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-8 sm:p-10 md:p-12">
            <div className="w-full max-w-md">
              <div className="text-center md:text-left">
                <p className="text-sm font-medium text-[#875A6B]">
                  Welcome back
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
                  Log in
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Access your saved venues, event ideas, and planning details.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="h-12 w-full rounded-2xl border border-[#EABAB0]/45 bg-white/90 pl-11 pr-4 text-slate-800 shadow-sm outline-none transition focus:border-[#875A6B]/45 focus:ring-4 focus:ring-[#EABAB0]/25"
                      required
                      disabled={isSubmitting || isGoogleSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      className="h-12 w-full rounded-2xl border border-[#EABAB0]/45 bg-white/90 pl-11 pr-12 text-slate-800 shadow-sm outline-none transition focus:border-[#875A6B]/45 focus:ring-4 focus:ring-[#EABAB0]/25"
                      required
                      disabled={isSubmitting || isGoogleSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#875A6B]"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      disabled={isSubmitting || isGoogleSubmitting}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end text-sm">
                <Link
                  to="/forgot-password"
                  state={{ isProvider: false }}
                  className="font-semibold text-[#875A6B] hover:text-[#6f4958]"
                >
                  Forgot password?
                </Link>
                </div>

                {errorMessage && (
                  <div className="rounded-2xl border border-[#EABAB0]/55 bg-[#fcf5f3] px-4 py-3 text-sm text-[#875A6B]">
                    <p>{errorMessage}</p>

                    {showProviderLoginLink && (
                      <Link
                        to="/provider/login"
                        className="mt-2 inline-block font-semibold underline hover:text-[#6f4958]"
                      >
                        Go to provider login
                      </Link>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleSubmitting}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#875A6B] text-sm font-semibold text-white shadow-lg shadow-[#EABAB0]/45 hover:bg-[#6f4958] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Signing in..." : "Log in"}
                  {!isSubmitting && <ArrowRight className="size-4" />}
                </button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#EABAB0]/40" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                      or
                    </span>
                  </div>
                </div>

              <button
                type="button"
                onClick={() => void handleGoogleSignIn()}
                disabled={isSubmitting || isGoogleSubmitting}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[#EABAB0]/45 bg-white/90 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-[#fcf5f3] disabled:cursor-not-allowed disabled:opacity-70"
              >
                
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    fill="#FFC107"
                    d="M43.611 20.083H42V20H24v8h11.303C33.655 32.657 29.203 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.277 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917Z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.277 4 24 4 16.318 4 9.656 8.337 6.306 14.691Z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24 44c5.176 0 9.946-1.977 13.518-5.192l-6.241-5.238C29.203 36 24 36 24 36c-5.182 0-9.625-3.33-11.284-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44Z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.611 20.083H42V20H24v8h11.303a12.05 12.05 0 0 1-4.026 5.808l.003-.002 6.241 5.238C36.99 39.22 44 34 44 24c0-1.341-.138-2.65-.389-3.917Z"
                  />
                </svg>

                {isGoogleSubmitting
                  ? "Redirecting to Google..."
                  : "Continue with Google"}
              </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600 md:text-left">
                Don&apos;t have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-[#875A6B] hover:text-[#6f4958]"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
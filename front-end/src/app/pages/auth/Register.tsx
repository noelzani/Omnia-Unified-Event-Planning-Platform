import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../../lib/supabase";

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function checkPasswordRequirements(pw: string) {
  return {
    length:    pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number:    /[0-9]/.test(pw),
    special:   /[^A-Za-z0-9]/.test(pw),
  };
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const requirements = checkPasswordRequirements(password);
  const allRequirementsMet = Object.values(requirements).every(Boolean);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim()) {
      setErrorMessage("Name is required.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Email is required.");
      return;
    }

    if (!isEmailValid) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Password is required.");
      return;
    }

    if (!allRequirementsMet) {
      const missing: string[] = [];
      if (!requirements.length)    missing.push("8+ characters");
      if (!requirements.uppercase) missing.push("uppercase letter");
      if (!requirements.lowercase) missing.push("lowercase letter");
      if (!requirements.number)    missing.push("number");
      if (!requirements.special)   missing.push("special character");
      setPasswordTouched(true);
      setPasswordError(`Missing: ${missing.join(", ")}`);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmTouched(true);
      setConfirmError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (!data.user) {
        setErrorMessage("User was not created.");
        return;
      }

      const { error: insertError } = await supabase.from("users").insert({
        user_id: data.user.id,
        name: name.trim(),
        surname: surname.trim() || null,
        phone: phone.trim() || null,
        role_id: 4,
        status: "Active",
      });

      if (insertError) {
        setErrorMessage(insertError.message);
        return;
      }

      setSuccessMessage(
        "Account created successfully. Please check your email."
      );

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating your account."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[linear-gradient(135deg,#fdf7f8_0%,#fffaf8_52%,#fcf5f3_100%)] px-4 py-4 md:py-5">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-80px] top-[80px] h-72 w-72 rounded-full bg-[#EABAB0]/40 blur-3xl" />
        <div className="absolute right-[-60px] top-[100px] h-80 w-80 rounded-full bg-[#875A6B]/15 blur-3xl" />
        <div className="absolute bottom-[-60px] left-1/3 h-72 w-72 rounded-full bg-[#EABAB0]/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex h-full max-w-[1080px] items-center justify-center">
        <div className="grid max-h-[92vh] w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl md:grid-cols-[1.02fr_0.98fr]">
          <div className="relative min-h-[360px] overflow-hidden">
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
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,251,0.10),rgba(35,25,35,0.30))]" />
              </div>
            ))}

            <div className="absolute bottom-5 left-5 right-5 rounded-[1.5rem] border border-white/30 bg-white/20 p-4 text-white backdrop-blur-md">
              <h2 className="text-2xl font-semibold leading-tight">
                {slides[currentSlide].title}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/90">
                {slides[currentSlide].text}
              </p>

              <div className="mt-4 flex gap-2">
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

          <div className="flex items-start justify-center overflow-y-auto p-5 sm:p-6 md:p-7">
            <div className="w-full max-w-md">
              <div className="text-center md:text-left">
                <p className="text-sm font-medium text-[#875A6B]">
                  Join us today
                </p>
                <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-slate-900">
                  Create account
                </h1>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  Save your favorite venues, manage bookings, and start planning
                  beautifully.
                </p>
              </div>

              <form onSubmit={handleRegister} className="mt-5 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium text-slate-700"
                    >
                      Name
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Your name"
                        className="h-10 w-full rounded-2xl border border-[#EABAB0]/45 bg-white/90 pl-11 pr-4 text-slate-800 shadow-sm outline-none transition focus:border-[#875A6B]/45 focus:ring-4 focus:ring-[#EABAB0]/25"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="surname"
                      className="text-sm font-medium text-slate-700"
                    >
                      Surname
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="surname"
                        type="text"
                        value={surname}
                        onChange={(event) => setSurname(event.target.value)}
                        placeholder="Your surname"
                        className="h-10 w-full rounded-2xl border border-[#EABAB0]/45 bg-white/90 pl-11 pr-4 text-slate-800 shadow-sm outline-none transition focus:border-[#875A6B]/45 focus:ring-4 focus:ring-[#EABAB0]/25"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="phone"
                    className="text-sm font-medium text-slate-700"
                  >
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="phone"
                      type="text"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="Your phone number"
                      className="h-10 w-full rounded-2xl border border-[#EABAB0]/45 bg-white/90 pl-11 pr-4 text-slate-800 shadow-sm outline-none transition focus:border-[#875A6B]/45 focus:ring-4 focus:ring-[#EABAB0]/25"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
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
                      onBlur={() => setEmailTouched(true)}
                      placeholder="you@example.com"
                      className={`h-10 w-full rounded-2xl border bg-white/90 pl-11 pr-4 text-slate-800 shadow-sm outline-none transition focus:ring-4 ${
                        emailTouched && email && !isEmailValid
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-[#EABAB0]/45 focus:border-[#875A6B]/45 focus:ring-[#EABAB0]/25"
                      }`}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
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
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setPasswordError("");
                      }}
                      onBlur={() => setPasswordTouched(true)}
                      placeholder="Create a password"
                      className={`h-10 w-full rounded-2xl border bg-white/90 pl-11 pr-12 text-slate-800 shadow-sm outline-none transition focus:ring-4 ${
                        (passwordTouched && password && !allRequirementsMet) || passwordError
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-[#EABAB0]/45 focus:border-[#875A6B]/45 focus:ring-[#EABAB0]/25"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-xs text-red-500">{passwordError}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-slate-700"
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setConfirmError("");
                      }}
                      onBlur={() => setConfirmTouched(true)}
                      placeholder="Repeat your password"
                      className={`h-10 w-full rounded-2xl border bg-white/90 pl-11 pr-12 text-slate-800 shadow-sm outline-none transition focus:ring-4 ${
                        (confirmTouched && confirmPassword && confirmPassword !== password) || confirmError
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-[#EABAB0]/45 focus:border-[#875A6B]/45 focus:ring-[#EABAB0]/25"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {confirmError && (
                    <p className="text-xs text-red-500">{confirmError}</p>
                  )}
                </div>

                {errorMessage && (
                  <div className="rounded-2xl border border-[#EABAB0]/55 bg-[#fcf5f3] px-4 py-2.5 text-sm text-[#875A6B]">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-[#875A6B] text-sm font-semibold text-white shadow-lg shadow-[#EABAB0]/45 hover:bg-[#6f4958] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Creating account..." : "Create account"}
                  {!isSubmitting && <ArrowRight className="size-4" />}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-slate-600 md:text-left">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[#875A6B] hover:text-[#6f4958]"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

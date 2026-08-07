"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type HTMLInputTypeAttribute,
} from "react";
import {
  ApiError,
  INVALID_CREDENTIALS_MESSAGE,
  type AccountType,
  type FieldErrors,
} from "@/lib/api";
import { accountHomePath, safeRedirectPath } from "@/lib/routing";
import { useAuth } from "@/contexts/auth-context";
import { ApplyAiLogo } from "@/components/auth/applyai-logo";

type AuthMode = "login" | "register";

type FormValues = {
  accountType: AccountType;
  companyName: string;
  confirmPassword: string;
  email: string;
  name: string;
  password: string;
};

type FieldName = keyof FormValues;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const motionEase = [0.22, 1, 0.36, 1] as const;

function validateForm(mode: AuthMode, values: FormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (mode === "register" && !values.name.trim()) {
    errors.name = "Enter your name.";
  }

  if (mode === "register" && values.accountType === "hr" && !values.companyName.trim()) {
    errors.companyName = "Enter your company name.";
  }

  if (!emailPattern.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Enter your password.";
  } else if (mode === "register" && values.password.length < 8) {
    errors.password = "Use at least 8 characters.";
  }

  if (mode === "register" && values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords must match.";
  }

  return errors;
}

function AuthInput({
  error,
  label,
  name,
  onChange,
  type,
  value,
}: {
  error?: string;
  label: string;
  name: FieldName;
  onChange: (name: FieldName, value: string) => void;
  type: HTMLInputTypeAttribute;
  value: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-[#20332a]" htmlFor={name}>
        {label}
      </label>
      <input
        aria-describedby={error ? `${name}-error` : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={
          name === "confirmPassword"
            ? "new-password"
            : name === "password"
              ? "current-password"
              : name
        }
        className={`mt-2 h-12 w-full rounded-2xl border bg-[#fbfaf4] px-4 text-sm font-medium text-[#062b1f] outline-none transition placeholder:text-[#87917f] focus:border-[#588100] focus:bg-white focus:ring-4 focus:ring-[#a6f20f]/20 ${
          error ? "border-[#b33a2b]" : "border-[#d8d5c8]"
        }`}
        id={name}
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        type={type}
        value={value}
      />
      {error ? (
        <p className="mt-2 text-sm font-medium text-[#9f2f22]" id={`${name}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PasswordInput({
  autoComplete,
  error,
  label,
  name,
  onChange,
  value,
}: {
  autoComplete: "current-password" | "new-password";
  error?: string;
  label: string;
  name: "password" | "confirmPassword";
  onChange: (name: FieldName, value: string) => void;
  value: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <label className="text-sm font-semibold text-[#20332a]" htmlFor={name}>
        {label}
      </label>
      <div className="relative mt-2">
        <input
          aria-describedby={error ? `${name}-error` : undefined}
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          className={`h-12 w-full rounded-2xl border bg-[#fbfaf4] px-4 pr-20 text-sm font-medium text-[#062b1f] outline-none transition placeholder:text-[#87917f] focus:border-[#588100] focus:bg-white focus:ring-4 focus:ring-[#a6f20f]/20 ${
            error ? "border-[#b33a2b]" : "border-[#d8d5c8]"
          }`}
          id={name}
          name={name}
          onChange={(event) => onChange(name, event.target.value)}
          type={isVisible ? "text" : "password"}
          value={value}
        />
        <button
          className="absolute right-2 top-1/2 inline-flex h-8 -translate-y-1/2 items-center justify-center rounded-full px-3 text-xs font-semibold text-[#405047] transition hover:bg-[#eff3df] hover:text-[#062b1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
          onClick={() => setIsVisible((current) => !current)}
          type="button"
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-sm font-medium text-[#9f2f22]" id={`${name}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 rounded-full border-2 border-[#f7f5ec]/45 border-t-[#a6f20f]"
    />
  );
}

export function AuthPage({
  mode,
  redirectTo = "/app",
}: {
  mode: AuthMode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const reduceMotion = shouldReduceMotion === true;
  const { login, register, status, user } = useAuth();
  const [values, setValues] = useState<FormValues>({
    accountType: "candidate",
    companyName: "",
    confirmPassword: "",
    email: "",
    name: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = useMemo(
    () =>
      mode === "login"
        ? {
            button: "Sign in",
            description: "Sign in to continue tailoring resumes and tracking applications.",
            footerAction: "Create an account",
            footerText: "New to ApplyAI?",
            heading: "Welcome back",
            loading: "Signing in...",
            switchHref: "/register",
          }
        : {
            button: "Create account",
            description:
              "Choose the workspace that fits how you use ApplyAI.",
            footerAction: "Sign in",
            footerText: "Already have an account?",
            heading: "Create your ApplyAI account",
            loading: "Creating account...",
            switchHref: "/login",
          },
    [mode],
  );

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(accountHomePath(user.account_type));
    }
  }, [router, status, user]);

  function updateField(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(mode, values);
    setFieldErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const nextUser = mode === "login"
        ? await login({
          email: values.email.trim(),
          password: values.password,
        })
        : await register({
          account_type: values.accountType,
          company_name: values.accountType === "hr" ? values.companyName.trim() : undefined,
          email: values.email.trim(),
          name: values.name.trim(),
          password: values.password,
        });

      router.replace(
        nextUser.account_type === "candidate"
          ? safeRedirectPath(redirectTo)
          : accountHomePath(nextUser.account_type),
      );
    } catch (error) {
      if (error instanceof ApiError) {
        const isInvalidCredentials =
          mode === "login" &&
          error.fieldErrors.email === INVALID_CREDENTIALS_MESSAGE;

        setFieldErrors(isInvalidCredentials ? {} : error.fieldErrors);
        setFormError(
          isInvalidCredentials ? INVALID_CREDENTIALS_MESSAGE : error.message,
        );
      } else {
        setFormError("Network trouble interrupted the request. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const cardMotion = reduceMotion
    ? {}
    : {
        animate: { opacity: 1, scale: 1, y: 0 },
        initial: { opacity: 0, scale: 0.98, y: 12 },
        transition: { duration: 0.5, ease: motionEase },
      };

  const itemMotion = reduceMotion
    ? {}
    : {
        animate: { opacity: 1, y: 0 },
        initial: { opacity: 0, y: 10 },
        transition: { duration: 0.42, ease: motionEase },
      };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#fbfaf4] px-5 py-10 text-[#062b1f] sm:px-6">
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(#d8d5c8 1px, transparent 1px), linear-gradient(90deg, #d8d5c8 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute left-1/2 top-16 h-56 w-[min(760px,92vw)] -translate-x-1/2 rounded-[48px] bg-[#dfe9d2]/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 left-1/2 h-px w-[min(860px,92vw)] -translate-x-1/2 bg-[#d8d5c8]"
        aria-hidden="true"
      />

      <motion.section
        className="relative z-10 mx-auto w-full max-w-[520px] rounded-[28px] border border-[#e1ded1] bg-white p-6 shadow-[0_22px_70px_rgba(6,43,31,0.1)] sm:p-8"
        {...cardMotion}
      >
        <motion.div className="flex items-center justify-between gap-4" {...itemMotion}>
          <ApplyAiLogo href="/login" />
          <Link
            className="text-sm font-semibold text-[#405047] transition hover:text-[#062b1f]"
            href="/"
          >
            Back home
          </Link>
        </motion.div>

        <motion.div
          className="mt-8"
          {...itemMotion}
          transition={reduceMotion ? undefined : { duration: 0.42, delay: 0.08, ease: motionEase }}
        >
          <h1 className="text-3xl font-semibold leading-tight text-[#062b1f]">
            {copy.heading}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#657167]">{copy.description}</p>
        </motion.div>

        {formError ? (
          <div
            className="mt-6 rounded-2xl border border-[#efc8bf] bg-[#fff7f4] px-4 py-3 text-sm font-medium leading-6 text-[#8b281f]"
            role="alert"
          >
            {formError}
          </div>
        ) : null}

        <form className="mt-6 grid gap-5" noValidate onSubmit={handleSubmit}>
          {mode === "register" ? (
            <motion.div
              {...itemMotion}
              transition={reduceMotion ? undefined : { duration: 0.38, delay: 0.14, ease: motionEase }}
            >
              <fieldset>
                <legend className="text-sm font-semibold text-[#20332a]">I am joining as</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {([
                    ["candidate", "Candidate", "Analyze resumes and track applications."],
                    ["hr", "HR / company", "Create your company workspace."],
                  ] as const).map(([accountType, label, description]) => {
                    const selected = values.accountType === accountType;

                    return (
                      <button
                        aria-pressed={selected}
                        className={`rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f] ${
                          selected
                            ? "border-[#588100] bg-[#eff9d1]"
                            : "border-[#d8d5c8] bg-[#fbfaf4] hover:border-[#b7b29f]"
                        }`}
                        key={accountType}
                        onClick={() => updateField("accountType", accountType)}
                        type="button"
                      >
                        <span className="block text-sm font-semibold text-[#20332a]">{label}</span>
                        <span className="mt-1 block text-xs leading-5 text-[#657167]">{description}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <div className="mt-5">
                <AuthInput
                  error={fieldErrors.name}
                  label="Your name"
                  name="name"
                  onChange={updateField}
                  type="text"
                  value={values.name}
                />
              </div>
              {values.accountType === "hr" ? (
                <div className="mt-5">
                  <AuthInput
                    error={fieldErrors.companyName}
                    label="Company name"
                    name="companyName"
                    onChange={updateField}
                    type="text"
                    value={values.companyName}
                  />
                </div>
              ) : null}
            </motion.div>
          ) : null}

          <motion.div
            {...itemMotion}
            transition={reduceMotion ? undefined : { duration: 0.38, delay: mode === "register" ? 0.2 : 0.14, ease: motionEase }}
          >
            <AuthInput
              error={fieldErrors.email}
              label="Email"
              name="email"
              onChange={updateField}
              type="email"
              value={values.email}
            />
          </motion.div>

          <motion.div
            {...itemMotion}
            transition={reduceMotion ? undefined : { duration: 0.38, delay: mode === "register" ? 0.26 : 0.2, ease: motionEase }}
          >
            <PasswordInput
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              error={fieldErrors.password}
              label="Password"
              name="password"
              onChange={updateField}
              value={values.password}
            />
          </motion.div>

          {mode === "register" ? (
            <motion.div
              {...itemMotion}
              transition={reduceMotion ? undefined : { duration: 0.38, delay: 0.32, ease: motionEase }}
            >
              <PasswordInput
                autoComplete="new-password"
                error={fieldErrors.confirmPassword}
                label="Confirm password"
                name="confirmPassword"
                onChange={updateField}
                value={values.confirmPassword}
              />
            </motion.div>
          ) : null}

          <motion.button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#062b1f] px-6 text-sm font-semibold text-[#f7f5ec] shadow-[0_16px_34px_rgba(6,43,31,0.18)] transition duration-200 hover:bg-[#031a13] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
            disabled={isSubmitting}
            type="submit"
            {...itemMotion}
            transition={reduceMotion ? undefined : { duration: 0.38, delay: mode === "register" ? 0.38 : 0.26, ease: motionEase }}
          >
            {isSubmitting ? <Spinner /> : null}
            {isSubmitting ? copy.loading : copy.button}
          </motion.button>
        </form>

        <motion.p
          className="mt-6 text-center text-sm text-[#657167]"
          {...itemMotion}
          transition={reduceMotion ? undefined : { duration: 0.38, delay: mode === "register" ? 0.44 : 0.32, ease: motionEase }}
        >
          {copy.footerText}{" "}
          <Link
            className="font-semibold text-[#062b1f] transition hover:text-[#588100]"
            href={copy.switchHref}
          >
            {copy.footerAction}
          </Link>
        </motion.p>
      </motion.section>
    </main>
  );
}

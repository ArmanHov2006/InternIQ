"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const passwordScore =
    (password.length >= 6 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/\d/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
  const strengthMeta = (() => {
    if (passwordScore >= 4) return { label: "Strong", color: "text-green-500", bar: "bg-green-500" };
    if (passwordScore === 3) return { label: "Good", color: "text-blue-500", bar: "bg-blue-500" };
    if (passwordScore === 2) return { label: "Fair", color: "text-amber-500", bar: "bg-amber-500" };
    return { label: "Weak", color: "text-red-500", bar: "bg-red-500" };
  })();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Create the auth user first without metadata so DB username generation
      // does not fail on duplicate full names.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // When a session exists right away (common when email confirmation is off),
      // persist the full name after signup through the profile API.
      if (data.session) {
        const res = await fetch("/api/profile", {
          method: "PUT",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ full_name: fullName }),
        });
        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          toast.error(payload?.error ?? "Account created, but profile name was not saved.");
        }
        toast.success("Account created! Redirecting to dashboard...");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      toast.success("Account created! Check your inbox to confirm your email.");
      router.push("/login?checkEmail=1");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      description="Start your internship system with clean structure from day one."
      ctaLabel="Already have an account?"
      ctaHref="/login"
      ctaText="Sign in"
    >
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Arman Hovhannisyan"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={loading}
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
            autoComplete="new-password"
          />
          <div className="space-y-2">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    passwordScore > idx ? strengthMeta.bar : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs font-medium ${strengthMeta.color}`}>{strengthMeta.label}</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" className="mt-1 w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          By creating an account, you agree to our Terms and Privacy Policy.
        </p>
        <p className="text-xs text-muted-foreground">
          If email verification is enabled, we&apos;ll send a confirmation link before first login.
        </p>
      </form>
    </AuthShell>
  );
}

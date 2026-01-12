"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Login } from "@/utils/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getUserProfile } from "@/utils/api/user";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isValidEthiopianPhone = (phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    return cleanPhone.length === 9 && cleanPhone.startsWith("9");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidEthiopianPhone(phone)) {
      setError("Please enter a valid Ethiopian phone number");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      await Login({ phone: `+251${cleanPhone}`, password });
      await getUserProfile();

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneInput = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 9);
    if (!cleaned) return "";
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-3">
            Welcome Back
          </h1>
          <p className="text-lg text-muted-foreground">Sign in to continue</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                +251
              </span>
              <Input
                type="tel"
                placeholder="912 345 678"
                value={formatPhoneInput(phone)}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))
                }
                className="pl-14 h-12 rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              9-digit Ethiopian phone number
            </p>
          </div>

          {/* <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div> */}

          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              Password
            </label>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pr-12 rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base font-semibold rounded-lg"
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-8 space-y-4 text-center">
          <Link
            href="/auth/forgot-password"
            className="block text-primary text-sm font-semibold hover:opacity-80 transition"
          >
            Forgot Password?
          </Link>
          <p className="text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="text-primary font-semibold hover:opacity-80 transition"
            >
              Create One
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

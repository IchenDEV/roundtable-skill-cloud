"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { FadeIn } from "@/components/MotionRoot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AUTH_ERROR_HINT: Record<string, string> = {
  otp_expired: "邮件里的链接已过期或已使用过，请重新发送一封登录邮件。",
  access_denied: "登录未完成或被拒绝，请重试或重新发送链接。",
};

export function LoginClient() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [flashErr, setFlashErr] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("auth_error");
    if (!code) return;
    setFlashErr(AUTH_ERROR_HINT[code] ?? `登录异常（${code}），请重试。`);
    window.history.replaceState(null, "", "/login");
  }, []);

  const clearMessages = useCallback(() => {
    setErr(null);
    setFlashErr(null);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setErr("本站尚未接通邮箱登入，请联系维护者。");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/roundtable`,
      },
    });
    if (error) setErr(error.message);
    else setSent(true);
  };

  const banner = err ?? flashErr;

  return (
    <FadeIn>
      <h1 className="mb-6 font-serif text-2xl tracking-[0.2em] text-ink-900">登入</h1>
      <p className="mb-6 text-sm text-ink-700">
        输入常用邮箱，我们会向你的信箱寄一封短函；点开信中的链接即可回到圆桌，无需另设密码。
      </p>
      {banner && (
        <Alert variant="destructive" className="mb-6 border-cinnabar-600/40 bg-cinnabar-600/5 font-sans text-ink-900">
          <AlertTitle className="text-cinnabar-800">提示</AlertTitle>
          <AlertDescription className="text-ink-800">{banner}</AlertDescription>
        </Alert>
      )}
      {sent ? (
        <p className="text-ink-800">已发送链接，请查收邮箱。</p>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="max-w-sm space-y-4 font-sans">
          <div className="space-y-2">
            <Label htmlFor="login-email">邮箱</Label>
            <Input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (err) setErr(null);
              }}
              placeholder="you@example.com"
              className="bg-paper-50/80"
              autoComplete="email"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-ink-900 text-primary-foreground shadow-sm transition-[transform,box-shadow] duration-150 hover:bg-ink-800 active:scale-[0.99]"
          >
            发送魔法链接
          </Button>
        </form>
      )}
    </FadeIn>
  );
}

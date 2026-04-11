import { Suspense } from "react";
import { LoginClient } from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-600">加载…</p>}>
      <LoginClient />
    </Suspense>
  );
}

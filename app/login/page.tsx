import { LoginClient } from "./login-client";

type LoginPageProps = {
  searchParams: Promise<{ auth_error?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const authError = Array.isArray(params.auth_error) ? params.auth_error[0] : params.auth_error;

  return <LoginClient initialAuthError={authError} />;
}

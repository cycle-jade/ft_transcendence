import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Card from "@/components/ui/Card";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { useAuth } from "@/context/AuthContext";

// Login is a two-step process:
// Step 1 — nickname + password → backend sends a code to your email
// Step 2 — enter that code → receive the real JWT token
export default function LoginPage() {
  const { t } = useTranslation(["auth", "common"]);
  const router = useRouter();
  const { loginStep1, verifyCode } = useAuth();

  const [step, setStep]               = useState(1); // 1 or 2
  const [nickname, setNickname]       = useState("");
  const [password, setPassword]       = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [code, setCode]               = useState("");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);

  // Step 1: send credentials, move to code-entry screen
  async function handleCredentials(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await loginStep1(nickname, password);
      if (result.requiresTwoFactor) {
        setVerificationId(result.verificationId);
        setStep(2);
      } else {
        // Backend returned a token directly (unlikely per current impl but handle it)
        router.push("/posts");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your nickname and password.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: send verificationId + code from email → get real token
  async function handleCode(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await verifyCode(verificationId, code);
      router.push("/posts");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">{t("auth:login.title")}</h1>

      <Card>
        {step === 1 ? (
          <form onSubmit={handleCredentials} className="space-y-4">
            {error && <Alert variant="danger">{error}</Alert>}

            <div>
              <Label htmlFor="nickname">{t("auth:login.nickname")}</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t("auth:login.nickname")}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">{t("auth:login.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth:login.submitting") : t("auth:login.submit")}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCode} className="space-y-4">
            {error && <Alert variant="danger">{error}</Alert>}

            <Alert variant="info">
              {t("auth:login.codePrompt")}
            </Alert>

            <div>
              <Label htmlFor="code">{t("auth:login.code")}</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                required
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth:login.verifying") : t("auth:login.verify")}
            </Button>

            <button
              type="button"
              onClick={() => { setStep(1); setError(""); setCode(""); }}
              className="w-full text-center text-sm text-text-tertiary hover:text-text-secondary"
            >
              {t("auth:login.backToLogin")}
            </button>
          </form>
        )}
      </Card>

      <p className="mt-4 text-center text-sm text-text-secondary">
        {t("auth:login.noAccount")}{" "}
        <Link href="/auth/register" className="text-accent hover:text-accent-hover">
          {t("auth:login.registerLink")}
        </Link>
      </p>
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "auth"])),
    },
  };
}

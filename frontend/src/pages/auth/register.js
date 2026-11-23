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

export default function RegisterPage() {
  const { t } = useTranslation(["auth", "common"]);
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    lastName: "",
    nickname: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(form);
      router.push("/posts");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">{t("auth:register.title")}</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}

          <div>
            <Label htmlFor="name">{t("auth:register.name")}</Label>
            <Input id="name" name="name" value={form.name} onChange={handleChange} required />
          </div>

          <div>
            <Label htmlFor="lastName">{t("auth:register.lastName")}</Label>
            <Input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} required />
          </div>

          <div>
            <Label htmlFor="nickname">{t("auth:register.nickname")}</Label>
            <Input id="nickname" name="nickname" value={form.nickname} onChange={handleChange} required />
          </div>

          <div>
            <Label htmlFor="email">{t("auth:register.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">{t("auth:register.phone")}</Label>
            <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
          </div>

          <div>
            <Label htmlFor="password">{t("auth:register.password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("auth:register.submitting") : t("auth:register.submit")}
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-text-secondary">
        {t("auth:register.hasAccount")}{" "}
        <Link href="/auth/login" className="text-accent hover:text-accent-hover">
          {t("auth:register.loginLink")}
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

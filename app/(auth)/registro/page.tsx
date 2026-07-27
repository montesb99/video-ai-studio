"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { registerAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const [state, formAction, pending] = useActionState(registerAction, {
    error: null,
  });

  return (
    <div>
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">{t("name")}</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder={t("namePlaceholder")}
            required
            autoComplete="name"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            required
            autoComplete="email"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
        </div>

        {state.error && (
          <p className="text-sm text-[color:var(--color-danger)]">
            {t("error")}
          </p>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="mt-2 bg-gradient-accent text-white hover:brightness-110"
        >
          {pending ? t("submitting") : t("submit")}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-[#B06AF0] hover:text-[#C79BF5]">
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}

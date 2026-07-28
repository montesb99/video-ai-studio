import { getTranslations } from "next-intl/server";
import { IntegrationCard } from "./_components/integration-card";
import { getCatalogCounts, getIntegrations } from "./data";
import type { IntegrationProvider } from "./actions";

const PROVIDERS: IntegrationProvider[] = ["elevenlabs", "heygen", "openai"];

export default async function IntegrationsPage() {
  const t = await getTranslations("integrations");
  const [integrations, catalogCounts] = await Promise.all([getIntegrations(), getCatalogCounts()]);
  const heygenActive = integrations.some((i) => i.provider === "heygen" && i.status === "active");

  return (
    <div className="p-7 pb-10">
      <div className="mb-6">
        <div className="text-2xl font-semibold tracking-tight">{t("title")}</div>
        <div className="mt-1 text-sm text-white/68">{t("subtitle")}</div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PROVIDERS.map((provider) => (
          <IntegrationCard
            key={provider}
            provider={provider}
            summary={integrations.find((i) => i.provider === provider)}
            heygenActive={provider === "elevenlabs" ? heygenActive : undefined}
            catalogCounts={catalogCounts}
          />
        ))}
      </div>
    </div>
  );
}

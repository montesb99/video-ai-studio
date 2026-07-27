import { getRequestConfig } from "next-intl/server";

// Video AI Studio es un producto de locale único: español (es-419).
// No hay selector de idioma ni rutas /es/ — ver docs/00-PRD.md §3.0.
export default getRequestConfig(async () => {
  const locale = "es";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

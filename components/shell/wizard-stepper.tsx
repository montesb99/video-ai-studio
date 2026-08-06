import Link from "next/link";
import { getTranslations } from "next-intl/server";

// docs/04-UX-FLOWS.md/docs/05-DESIGN-TOKENS.md §8: el stepper de 6 pasos se
// muestra siempre, aunque el paso 6 (escenas) todavía no tenga pantalla —
// sin ruta, se ve pero no es clicable. El paso 5 ("Avatar y marca", Sprint 4)
// hoy solo cubre avatar — Brand Kit sigue viviendo en su propia sección de
// navegación, fuera del wizard.
const STEP_ROUTES: Array<string | null> = ["idea", "propuestas", "guion", "voz", "avatar", null];

const STATUS_TO_STEP: Record<string, number> = {
  draft: 1,
  ingesting: 1,
  ideating: 2,
  scripting: 3,
  voicing: 4,
  styling: 5,
  visualizing: 5,
  avatar: 5,
  composing: 5,
  ready: 5,
  failed: 5,
};

/** El paso resaltado sale de projects.status (fuente de verdad en BD), no de la URL — docs/04-UX-FLOWS.md §3. */
export async function WizardStepper({ projectId, status }: { projectId: string; status: string }) {
  const t = await getTranslations("step");
  const currentStep = STATUS_TO_STEP[status] ?? 1;

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-white/6 px-7 py-4">
      {STEP_ROUTES.map((route, index) => {
        const step = index + 1;
        const isCurrent = step === currentStep;
        const isPast = step < currentStep;
        const label = (
          <div
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm whitespace-nowrap ${
              isCurrent ? "bg-[rgba(124,92,255,.14)] font-semibold text-foreground" : "font-medium"
            } ${isPast ? "text-white/68" : !isCurrent ? "text-white/32" : ""}`}
          >
            <span
              className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] ${
                isCurrent ? "bg-gradient-accent text-white" : "bg-white/8"
              }`}
            >
              {step}
            </span>
            {t(String(step))}
          </div>
        );

        return (
          <div key={route ?? `step-${step}`} className="flex items-center gap-1">
            {isPast && route ? <Link href={`/create/${projectId}/${route}`}>{label}</Link> : label}
            {index < STEP_ROUTES.length - 1 && <span className="mx-1 h-px w-4 flex-none bg-white/12" />}
          </div>
        );
      })}
    </div>
  );
}

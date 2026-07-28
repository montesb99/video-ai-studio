import { getProjectOrNotFound } from "./shared";
import { WizardStepper } from "@/components/shell/wizard-stepper";
import { DesktopOnlyGate } from "@/components/shell/desktop-only-gate";

export default async function ProjectWizardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { project } = await getProjectOrNotFound(projectId);

  return (
    <div className="h-full">
      <DesktopOnlyGate />
      <div className="hidden h-full flex-col md:flex">
        <WizardStepper projectId={project.id} status={project.status} />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

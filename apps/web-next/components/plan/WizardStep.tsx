interface Props {
  step: number;
  totalSteps: number;
  title: string;
  children: React.ReactNode;
}

export default function WizardStep({ step, totalSteps, title, children }: Props) {
  const progress = Math.round((step / totalSteps) * 100);

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Step {step} of {totalSteps}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h2 className="font-semibold text-foreground">{title}</h2>

      {children}
    </div>
  );
}

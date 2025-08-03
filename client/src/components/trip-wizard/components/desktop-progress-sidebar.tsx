const DesktopProgressSidebar = ({
  currentStep,
  completedSteps,
  stepTitles,
}: SidebarProps) => (
  <Card className="p-6 sticky top-8">
    <CardHeader className="pb-4">
      <CardTitle className="text-lg">Plan Your Trip</CardTitle>
      <CardDescription>Create your perfect road trip itinerary</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {stepTitles.map((title, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = completedSteps.includes(stepNumber);

        return (
          <div
            key={stepNumber}
            className={cn(
              "flex items-center space-x-3 p-3 rounded-lg transition-colors",
              isActive && "bg-primary/10 border border-primary/20",
              isCompleted && !isActive && "bg-green-50 border border-green-200"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                isActive && "bg-primary text-white",
                isCompleted && !isActive && "bg-green-500 text-white",
                !isActive && !isCompleted && "bg-slate-200 text-slate-600"
              )}
            >
              {isCompleted && !isActive ? (
                <Check className="w-4 h-4" />
              ) : (
                stepNumber
              )}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                isActive && "text-primary",
                isCompleted && !isActive && "text-green-700",
                !isActive && !isCompleted && "text-slate-600"
              )}
            >
              {title}
            </span>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

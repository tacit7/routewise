import { QuickRouteForm } from "./quick-route-form";

type QuickRouteFormInlineProps = React.ComponentProps<typeof QuickRouteForm>;

export function QuickRouteFormInline(props: QuickRouteFormInlineProps) {
  return (
    <div className="hero-card max-w-lg mx-auto">
      {/* Tab Navigation */}
      <div className="flex mb-6 bg-white/40 backdrop-blur-sm rounded-lg p-1 border border-white/40">
        <button className="flex-1 py-3 md:py-4 px-4 rounded-md font-medium transition-all bg-white/90 text-primary shadow-sm min-h-[48px]">
          Plan Route
        </button>
        <button className="flex-1 py-3 md:py-4 px-4 rounded-md font-medium transition-all text-muted-foreground hover:text-slate-900 hover:bg-white/60 min-h-[48px]">
          Explore Places
        </button>
      </div>

      <QuickRouteForm {...props} />
    </div>
  );
}
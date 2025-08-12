import { QuickRouteForm } from "./quick-route-form";

type QuickRouteFormInlineProps = React.ComponentProps<typeof QuickRouteForm>;

export function QuickRouteFormInline(props: QuickRouteFormInlineProps) {
  return (
    <div className="hero-card max-w-lg mx-auto">
      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-50 rounded-lg p-1 border border-gray-200/50">
        <button className="flex-1 py-3 md:py-4 px-4 rounded-md font-medium transition-all bg-white text-primary shadow-sm min-h-[48px]">
          <i className="fas fa-route mr-2" />
          Plan Route
        </button>
        <button className="flex-1 py-3 md:py-4 px-4 rounded-md font-medium transition-all text-muted-foreground hover:text-slate-900 hover:bg-white/50 min-h-[48px]">
          <i className="fas fa-compass mr-2" />
          Explore Places
        </button>
      </div>

      <QuickRouteForm {...props} />
    </div>
  );
}
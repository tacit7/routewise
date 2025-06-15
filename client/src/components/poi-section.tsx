import { useQuery } from "@tanstack/react-query";
import type { Poi } from "@shared/schema";
import PoiCard from "./poi-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PoiSection() {
  const { data: pois, isLoading, error } = useQuery<Poi[]>({
    queryKey: ["/api/pois"],
  });

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Discover Amazing Stops Along Your Way
          </h3>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            We've curated the best attractions, restaurants, and hidden gems to make your journey unforgettable.
          </p>
        </div>

        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <Skeleton className="w-full h-48" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">Failed to load attractions. Please try again later.</p>
          </div>
        )}

        {pois && pois.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">No attractions available at the moment.</p>
          </div>
        )}

        {pois && pois.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pois.map((poi) => (
              <PoiCard key={poi.id} poi={poi} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

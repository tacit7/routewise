import { MapPin, Compass, Smartphone } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: MapPin,
      title: "Smart Route Planning",
      description: "Instantly generate optimized routes with Google Maps integration for turn-by-turn navigation.",
      color: "text-primary bg-blue-50"
    },
    {
      icon: Compass,
      title: "Curated Discoveries",
      description: "Find hidden gems, local favorites, and must-see attractions along your journey.",
      color: "text-secondary bg-green-50"
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Plan and access your route on any device, perfect for on-the-go trip planning.",
      color: "text-accent bg-amber-50"
    }
  ];

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Why Choose RouteWise?
          </h3>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            We make road trip planning effortless with curated recommendations and seamless integration.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${feature.color}`}>
                <feature.icon className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-semibold text-slate-800 mb-2">{feature.title}</h4>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

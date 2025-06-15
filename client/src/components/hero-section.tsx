import RouteForm from "./route-form";

export default function HeroSection() {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')`
        }}
      />
      <div className="absolute inset-0 bg-slate-900 bg-opacity-40" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Plan Your Perfect <span className="text-accent">Road Trip</span>
        </h2>
        <p className="text-xl text-slate-200 mb-12 max-w-2xl mx-auto">
          Discover amazing stops along your route - from hidden gems to must-see attractions. Let's make every mile memorable.
        </p>
        
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl mx-auto">
          <RouteForm />
        </div>
      </div>
    </section>
  );
}

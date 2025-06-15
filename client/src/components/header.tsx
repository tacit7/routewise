import { Route } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <Route className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-slate-800">RouteWise</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="text-slate-600 hover:text-primary transition-colors">
              Discover
            </a>
            <a href="#" className="text-slate-600 hover:text-primary transition-colors">
              My Trips
            </a>
            <a href="#" className="text-slate-600 hover:text-primary transition-colors">
              Help
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}

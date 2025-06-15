import { Route } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Route className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">RouteWise</span>
            </div>
            <p className="text-slate-400">
              Making every journey memorable with smart route planning and curated discoveries.
            </p>
          </div>

          <div>
            <h5 className="font-semibold mb-4">Discover</h5>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Popular Routes</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Hidden Gems</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Local Favorites</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold mb-4">Support</h5>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Trip Planning Tips</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold mb-4">Connect</h5>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <i className="fab fa-facebook text-xl" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <i className="fab fa-twitter text-xl" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <i className="fab fa-instagram text-xl" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
          <p>&copy; 2024 RouteWise. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </div>
    </footer>
  );
}

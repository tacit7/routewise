import { useState, useEffect } from "react";
import { Map } from "lucide-react";
import TripPlanner from "./trip-planner";

export default function TripIndicator() {
  const [tripCount, setTripCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load initial count
    const loadTripCount = () => {
      const saved = localStorage.getItem("tripPlaces");
      if (saved) {
        const places = JSON.parse(saved);
        setTripCount(places.length);
      } else {
        setTripCount(0);
      }
    };

    loadTripCount();

    // Listen for updates
    const handleUpdate = () => {
      loadTripCount();
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("tripUpdated", handleUpdate);

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("tripUpdated", handleUpdate);
    };
  }, []);

  return (
    <>
      {tripCount > 0 && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 z-40 group"
        >
          <div className="relative">
            <Map className="h-6 w-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center group-hover:scale-110 transition-transform">
              {tripCount}
            </span>
          </div>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            View Trip ({tripCount} {tripCount === 1 ? 'place' : 'places'})
          </span>
        </button>
      )}

      {isOpen && <TripPlanner isOpen={isOpen} onClose={() => setIsOpen(false)} />}
    </>
  );
}
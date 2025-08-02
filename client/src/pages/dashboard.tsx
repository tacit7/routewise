import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth-context";
import { useLocation } from "wouter";
import Header from "@/components/header";

const Dashboard = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handlePlanNewTrip = () => {
    setLocation("/plan");
  };
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Use existing Header component */}
      <Header />

      {/* Welcome section for authenticated users */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.username}!
              </h1>
              <p className="text-gray-600">Plan your next adventure with RouteWise</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={handlePlanNewTrip}
              >
                Plan New Trip
              </Button>
              <Button variant="outline">
                Browse Saved Trips
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* My Saved Routes Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Saved Routes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Route Card 1 */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">San Francisco to Los Angeles</h3>
                    <p className="text-sm text-gray-600">Apr 10, 2024 – Apr 15, 2024</p>
                  </div>
                </div>
                <Button variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 min-h-[44px]">
                  View on Map
                  <i className="fas fa-external-link-alt ml-2 text-xs"></i>
                </Button>
              </CardContent>
            </Card>

            {/* Route Card 2 */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">New York to Boston</h3>
                    <p className="text-sm text-gray-600">No dates</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]" aria-label="Edit route">
                      <i className="fas fa-edit text-gray-400 hover:text-gray-600"></i>
                    </Button>
                    <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]" aria-label="Bookmark route">
                      <i className="fas fa-bookmark text-gray-400 hover:text-yellow-500"></i>
                    </Button>
                  </div>
                </div>
                <Button variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 min-h-[44px]">
                  View on Map
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* My Places Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Places</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Place Card 1 */}
            <Card className="shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-w-16 aspect-h-9">
                <img 
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop" 
                  alt="Sedona red rocks landscape" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Sedona</h3>
                <p className="text-sm text-gray-600 mb-4">Attraction</p>
                <Button variant="outline" className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 min-h-[44px]">
                  View on Map
                </Button>
              </CardContent>
            </Card>

            {/* Place Card 2 */}
            <Card className="shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-w-16 aspect-h-9">
                <img 
                  src="https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=400&h=250&fit=crop" 
                  alt="Austin skyline view" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Austin</h3>
                <p className="text-sm text-gray-600 mb-4">Parks</p>
                <Button variant="outline" className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 min-h-[44px]">
                  View on Map
                </Button>
              </CardContent>
            </Card>

            {/* Place Card 3 */}
            <Card className="shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-w-16 aspect-h-9">
                <img 
                  src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=250&fit=crop" 
                  alt="Griffith Observatory at night" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Griffith Observatory</h3>
                <p className="text-sm text-gray-600 mb-4">Attraction</p>
                <Button variant="outline" className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 min-h-[44px]">
                  View on Map
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
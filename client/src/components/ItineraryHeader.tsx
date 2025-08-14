import React from "react";
import { useLocation } from "wouter";
import { Check, LogIn, Save, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-context";
import UserMenu from "@/components/UserMenu";

interface ItineraryHeaderProps {
  lastSavedAt: Date | null;
  savedTripId: number | null;
  isSaving: boolean;
  isAuthenticated: boolean;
  onSaveTrip: () => void;
  onClearAll: () => void;
}

export default function ItineraryHeader({
  lastSavedAt,
  savedTripId,
  isSaving,
  isAuthenticated,
  onSaveTrip,
  onClearAll
}: ItineraryHeaderProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  return (
    <header className="bg-card border-b px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation('/')}
            className="hover:opacity-80 transition-opacity focus-ring"
            aria-label="Go to home page"
          >
            <span className="font-semibold text-lg text-foreground">
              RouteWise
            </span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          {lastSavedAt && (
            <span className="text-sm text-muted-foreground">
              Saved {lastSavedAt.toLocaleTimeString()}
            </span>
          )}
          {savedTripId && (
            <Button variant="outline" size="sm" onClick={onClearAll}>
              Clear All
            </Button>
          )}

          {/* Saved Status Check Icon */}
          {savedTripId && (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}

          {/* User Avatar with Save Icon */}
          {isAuthenticated && user ? (
            <div className="relative flex items-center">
              {/* Floppy Disk Save Icon */}
              <Button
                onClick={onSaveTrip}
                disabled={isSaving}
                variant="ghost"
                size="icon"
                className="h-8 w-8 mr-1"
                title="Quick Save"
              >
                <Save className="h-4 w-4" />
              </Button>
              
              {/* User Menu with Avatar */}
              <UserMenu />
            </div>
          ) : (
            <Button variant="outline" size="sm">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
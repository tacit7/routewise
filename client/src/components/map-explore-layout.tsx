import React from "react";

interface MapExploreLayoutProps {
  mapPanel: React.ReactNode;
  sidebar: React.ReactNode;
}

export function MapExploreLayout({ mapPanel, sidebar }: MapExploreLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Map Panel - Left Side */}
      <div className="flex-1 min-w-0">
        {mapPanel}
      </div>
      
      {/* Sidebar - Right Side */}
      <div className="w-96 border-l border-border bg-card">
        {sidebar}
      </div>
    </div>
  );
}
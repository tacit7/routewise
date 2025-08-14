import React from "react";

interface ExploreSidebarProps {
  searchPanel: React.ReactNode;
  poiList: React.ReactNode;
  tripOverview: React.ReactNode;
}

export function ExploreSidebar({ searchPanel, poiList, tripOverview }: ExploreSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Search & Filter Section */}
      <div className="border-b border-border">
        {searchPanel}
      </div>
      
      {/* POI List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {poiList}
      </div>
      
      {/* Trip Overview - Bottom */}
      <div className="border-t border-border bg-muted/20">
        {tripOverview}
      </div>
    </div>
  );
}
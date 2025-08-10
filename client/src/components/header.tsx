import React from "react";

interface HeaderProps {
  leftContent?: React.ReactNode; // Back button, etc.
  centerContent?: React.ReactNode; // Title, trip info, etc.
  rightContent?: React.ReactNode; // Actions, save button, etc.
}

export default function Header({ leftContent, centerContent, rightContent }: HeaderProps) {
  return (
    <div className="border-b bg-surface border-border">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {leftContent}
          {/* Center content when no explicit left content */}
          {!leftContent && centerContent && (
            <div className="flex-1">
              {centerContent}
            </div>
          )}
        </div>

        {/* Center section (when there is left content) */}
        {leftContent && centerContent && (
          <div className="flex-1">
            {centerContent}
          </div>
        )}

        {/* Right section */}
        {rightContent && (
          <div className="flex items-center gap-3">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
}

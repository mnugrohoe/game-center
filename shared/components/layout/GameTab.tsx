"use client";
/**
 * shared/components/layout/GameTab.tsx
 *
 * Sticky tab bar used by every game page.
 * Accepts any TabItem array so it's not coupled to GameTabId.
 */
import { TabItem } from "@/shared/types";
import { cn } from "@/shared/utils/cn";

interface GameTabProps {
  tabs:       TabItem[];
  activeTab:  string;
  onTabChange:(id: string) => void;
}

export function GameTab({ tabs, activeTab, onTabChange }: GameTabProps) {
  return (
    <nav className="sticky top-0 z-50 flex justify-center bg-bg/95 border-b border-gold-600 backdrop-blur-sm">
      {tabs.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          data-active={activeTab === id}
          className={cn(
            "tab-btn",
            activeTab === id && "tab-btn-active",
          )}
        >
          <span className="text-sm leading-none">{icon}</span>
          {label.toUpperCase()}
        </button>
      ))}
    </nav>
  );
}

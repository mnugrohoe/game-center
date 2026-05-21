"use client";
/**
 * shared/components/layout/PageLayout.tsx
 *
 * Shell wrapper every game page uses:
 *   tab bar (sticky) + full-height content area.
 */
import { ReactNode } from "react";
import { GameTab } from "./GameTab";
import { TabItem } from "@/shared/types";

interface PageLayoutProps {
  tabs:       TabItem[];
  activeTab:  string;
  onTabChange:(id: string) => void;
  children:   ReactNode;
}

export function PageLayout({ tabs, activeTab, onTabChange, children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <GameTab tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}

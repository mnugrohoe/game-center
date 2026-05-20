import { TabsProps, TabType } from "../types";
import GameTabs from "./GameTab";

interface PageProps {
  tabs: TabsProps[];
  activeTab: TabType;
  onTabChange: (id: TabType) => void;
  children: React.ReactNode;
}

export default function PageLayout({
  tabs,
  activeTab,
  onTabChange,
  children,
}: PageProps) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0f0e0d" }}
    >
      {/* Tab bar */}
      <GameTabs {...{ tabs, activeTab, onTabChange }} />
      <div className="flex-1">{children}</div>
    </div>
  );
}

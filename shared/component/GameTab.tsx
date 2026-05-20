import { TabType, TabsProps } from "../types";
import { cinzel } from "../utils/fonts";

interface GameTabProps {
  tabs: TabsProps[];
  activeTab: TabType;
  onTabChange: (id: TabType) => void;
}

export default function GameTab({
  tabs,
  activeTab,
  onTabChange,
}: GameTabProps) {
  return (
    <nav className="sticky top-0 z-50 flex justify-center bg-[rgba(15,14,13,0.95)] border-b border-[rgba(212,152,15,0.15)] backdrop-blur-sm">
      {tabs.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id as TabType)}
          className={`${cinzel.className} text-[0.7rem] tracking-widest px-7 py-3 border-none bg-transparent cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${
            activeTab === id
              ? "border-b-2 border-[#d4980f] text-[#d4980f]"
              : "border-b-2 border-transparent text-[rgba(200,168,64,0.35)]"
          }`}
        >
          <span style={{ fontSize: "0.85rem" }}>{icon}</span>
          {label.toUpperCase()}
        </button>
      ))}
    </nav>
  );
}

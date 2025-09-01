import AdvancedMapInterface from "@/components/AdvancedMapInterface";
import { BottomNav } from "@/components/ui/bottom-nav";

export default function Map() {
  return (
    <div className="pb-20 h-screen overflow-hidden">
      <AdvancedMapInterface />
      <BottomNav />
    </div>
  );
}
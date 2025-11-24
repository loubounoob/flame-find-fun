import Home from "./Home";
import { BottomNav } from "@/components/ui/bottom-nav";
const Index = () => {
  return <div className="min-h-screen bg-background">
      <Home />
      <BottomNav className="border-0 px-0 py-0 pb-[10px]" />
    </div>;
};
export default Index;
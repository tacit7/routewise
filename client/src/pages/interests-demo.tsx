import { useLocation } from "wouter";
import InterestsShowcase from "@/components/interests-showcase";

export default function InterestsDemo() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation("/");
  };

  return <InterestsShowcase onBack={handleBack} />;
}
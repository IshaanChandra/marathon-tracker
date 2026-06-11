import RefSections from "@/components/RefSections";
import ScenarioPicker from "@/components/ScenarioPicker";
import { reference } from "@/lib/plan";

export default function TravelPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/55 mb-2">
          Pick your travel scenarios
        </h2>
        <ScenarioPicker />
      </div>
      <RefSections sections={reference.travel} />
    </div>
  );
}

import { Suspense } from "react";
import TodayView from "@/components/TodayView";

export default function Home() {
  return (
    <Suspense>
      <TodayView />
    </Suspense>
  );
}

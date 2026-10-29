import GuideTabs from "@/components/GuideTabs";
import GuideHeader from "@/components/GuideHeader";

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <GuideHeader>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold tracking-tight">Guide</h1>
        <GuideTabs />
      </div>
      </GuideHeader>
      {children}
    </div>
  );
}

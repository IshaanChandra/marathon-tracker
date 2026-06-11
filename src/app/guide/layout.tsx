import GuideTabs from "@/components/GuideTabs";

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight">Guide</h1>
        <GuideTabs />
      </div>
      {children}
    </div>
  );
}

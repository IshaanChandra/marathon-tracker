import GuideTabs from "@/components/GuideTabs";

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold tracking-tight">Guide</h1>
        <GuideTabs />
      </div>
      {children}
    </div>
  );
}

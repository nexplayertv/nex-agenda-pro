import { ThemeToggle } from "@/components/theme-toggle";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        {children}
      </div>
    </div>
  );
}

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/** Standard chrome for admin, account, journey — not the public live show. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--color-navy-deep)]">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileFooter } from "@/components/layout/mobile-footer";
import { ScrollToTop } from "@/components/layout/scroll-to-top";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <ScrollToTop />
          {children}
        </main>
      </div>
      <MobileFooter />
    </div>
  );
}

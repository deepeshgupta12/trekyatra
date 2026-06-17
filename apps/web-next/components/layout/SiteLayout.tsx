import { Header } from "./Header";
import { Footer } from "./Footer";
import TrekSageWidget from "@/components/treksage/TrekSageWidget";

export const SiteLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-paper-grain">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
    <TrekSageWidget />
  </div>
);

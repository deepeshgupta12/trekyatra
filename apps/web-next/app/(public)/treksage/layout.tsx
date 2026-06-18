import { Header } from "@/components/layout/Header";

export default function TreksageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#FAF5EE]">
      <Header />
      {children}
    </div>
  );
}

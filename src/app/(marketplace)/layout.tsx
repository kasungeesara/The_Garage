import { NavBar } from "@/components/layout/navbar";
import SiteFooter from "@/components/layout/site-footer";
export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketplace">
      <NavBar />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

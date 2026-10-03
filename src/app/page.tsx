import { NavBar } from "@/components/layout/navbar";
import SiteFooter from "@/components/layout/site-footer";
import { HomePage } from "@/features/marketplace/home";
export default function Page() {
  return (
    <div className="marketplace">
      <NavBar />
      <main>
        <HomePage />
      </main>
      <SiteFooter />
    </div>
  );
}

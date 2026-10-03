import Link from "next/link";
import { Icon } from "@/components/ui/icons";
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Link className="brand" href="/">
            <span className="brand-mark">
              <Icon name="box" />
            </span>
            <span>
              AutoPart<span className="brand-light">Hub</span>
            </span>
          </Link>
          <p>
            The right part for every journey.
            <br />
            Connecting Sri Lanka’s drivers and parts specialists.
          </p>
          <span className="footer-location">
            <Icon name="pin" size={15} />
            Made for Sri Lanka · Prices in LKR
          </span>
        </div>
        {[
          [
            "Explore",
            ["Find parts", "/parts"],
            ["Categories", "/categories"],
            ["Brands", "/brands"],
            ["The journal", "/news"],
          ],
          [
            "Your workspace",
            ["My account", "/dashboard"],
            ["Become a seller", "/sell"],
            ["Seller dashboard", "/seller"],
            ["Administration", "/admin"],
          ],
          [
            "Here to help",
            ["About us", "/about"],
            ["Contact", "/contact"],
            ["FAQs", "/faq"],
            ["Buying safely", "/safety"],
          ],
        ].map(([title, ...links]) => (
          <div key={String(title)}>
            <h3>{title}</h3>
            {(links as string[][]).map(([label, href]) => (
              <Link href={href} key={href}>
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} AutoPart Hub. All rights reserved.
        </span>
        <span>Find your next part</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}

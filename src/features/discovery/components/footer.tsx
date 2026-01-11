import Link from "next/link";
import { KudosLogo } from "@/shared/components/kudos";
import { Container } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";

const FOOTER_LINKS = {
  discover: [
    { name: "Browse Courts", href: appRoutes.courts.base },
    { name: "Map View", href: `${appRoutes.courts.base}?view=map` },
    { name: "Free Courts", href: `${appRoutes.courts.base}?isFree=true` },
  ],
  owners: [
    { name: "List Your Court", href: appRoutes.owner.onboarding },
    { name: "Owner Dashboard", href: appRoutes.owner.base },
    { name: "Pricing", href: appRoutes.owner.pricing },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Blog", href: "/blog" },
  ],
  legal: [
    { name: "Terms of Service", href: appRoutes.terms.base },
    { name: "Privacy Policy", href: appRoutes.privacy.base },
    { name: "Cookie Policy", href: "/cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-card border-t mt-16">
      <Container>
        <div className="py-12">
          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href={appRoutes.index.base} className="inline-block">
                <KudosLogo size={40} variant="full" />
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                The unified platform for pickleball court discovery and booking.
              </p>
            </div>

            {/* Discover */}
            <div>
              <h3 className="font-heading font-semibold text-foreground mb-4">
                Discover
              </h3>
              <ul className="space-y-2">
                {FOOTER_LINKS.discover.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Owners */}
            <div>
              <h3 className="font-heading font-semibold text-foreground mb-4">
                For Owners
              </h3>
              <ul className="space-y-2">
                {FOOTER_LINKS.owners.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-heading font-semibold text-foreground mb-4">
                Company
              </h3>
              <ul className="space-y-2">
                {FOOTER_LINKS.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-heading font-semibold text-foreground mb-4">
                Legal
              </h3>
              <ul className="space-y-2">
                {FOOTER_LINKS.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} KudosCourts. All rights
              reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com/kudoscourts"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Facebook
              </a>
              <a
                href="https://instagram.com/kudoscourts"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}

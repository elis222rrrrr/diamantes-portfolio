import AnnouncementBar from "@/components/AnnouncementBar";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { CartProvider } from "@/lib/cart/CartContext";
import { getSiteSettings } from "@/lib/settings/repository";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <CartProvider>
      <div data-site-root className="flex min-h-screen w-full flex-col bg-black">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[100] focus:border focus:border-white/40 focus:bg-black focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        <AnnouncementBar />
        <Nav />
        <main id="main-content" className="flex flex-1 flex-col">
          {children}
        </main>
        <Footer instagramUrl={settings.instagramUrl} tiktokUrl={settings.tiktokUrl} />
        {gaMeasurementId && <GoogleAnalytics measurementId={gaMeasurementId} />}
        <CookieConsent />
      </div>
    </CartProvider>
  );
}

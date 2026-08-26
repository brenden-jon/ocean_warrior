import PulseHero from "@/components/PulseHero";
import PulseCards from "@/components/PulseCards";
import SiteHeader from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PulseHero />
        <PulseCards />
      </main>
    </>
  );
}

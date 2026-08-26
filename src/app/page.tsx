import PulseHero from "@/components/PulseHero";
import Proposition from "@/components/Proposition";
import PulseCards from "@/components/PulseCards";
import WhereToGo from "@/components/WhereToGo";
import SiteHeader from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PulseHero />
        <Proposition />
        <PulseCards />
        <WhereToGo />
      </main>
    </>
  );
}

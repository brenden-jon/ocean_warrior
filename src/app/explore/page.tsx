import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ExploreMap from "@/components/ExploreMap";

export const metadata: Metadata = {
  title: "Explore",
  description: "The ocean's current state, layer by layer.",
};

export default function ExplorePage() {
  return (
    <>
      <SiteHeader />
      <ExploreMap />
    </>
  );
}

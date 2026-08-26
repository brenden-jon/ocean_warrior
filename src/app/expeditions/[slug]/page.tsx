import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import ExpeditionDetail from "@/components/ExpeditionDetail";
import { EXPEDITIONS, getExpedition } from "@/data/expeditions";

export function generateStaticParams() {
  return EXPEDITIONS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const expedition = getExpedition(slug);
  if (!expedition) return { title: "Not found" };
  return { title: expedition.name, description: expedition.question };
}

export default async function ExpeditionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const expedition = getExpedition(slug);
  if (!expedition) notFound();

  return (
    <>
      <SiteHeader />
      <ExpeditionDetail slug={slug} />
    </>
  );
}

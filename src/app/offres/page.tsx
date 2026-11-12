import type { Metadata } from "next";
import { Offers } from "@/components/offers";

export const metadata: Metadata = { title: "Offres" };

export default function Page() {
  return <Offers />;
}

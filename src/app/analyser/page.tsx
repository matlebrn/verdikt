import type { Metadata } from "next";
import { Analyzer } from "@/components/analyzer";

export const metadata: Metadata = { title: "Analyser une conversation" };

export default function Page() {
  return <Analyzer />;
}

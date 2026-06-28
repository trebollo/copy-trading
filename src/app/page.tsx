import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LandingPage } from "./landing";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  const demoMode = process.env.DEMO_MODE === "true";

  return <LandingPage demoMode={demoMode} />;
}

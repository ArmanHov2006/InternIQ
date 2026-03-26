import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <FadeIn className="w-full max-w-xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 text-foreground">
          <BriefcaseBusiness className="h-5 w-5 text-blue-500" />
          <span className="text-lg font-semibold">InternIQ</span>
        </div>
        <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-7xl font-black tracking-tight text-transparent sm:text-8xl">
          404
        </h1>
        <p className="mt-4 text-2xl font-semibold text-foreground">Page not found</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </FadeIn>
    </div>
  );
}

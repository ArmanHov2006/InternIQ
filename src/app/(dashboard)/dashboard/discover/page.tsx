import { notFound } from "next/navigation";
import { isJobDiscoveryEnabled } from "@/lib/features";
import { DiscoverView } from "@/components/discover/discover-view";

export default function DiscoverPage() {
  if (!isJobDiscoveryEnabled()) {
    notFound();
  }

  return <DiscoverView />;
}

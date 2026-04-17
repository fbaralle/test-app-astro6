import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import CryptoDashboard from "./CryptoDashboard";
import FavoritesSection from "./FavoritesSection";
import PageViewsSection from "./PageViewsSection";
import FeatureFlagsSection from "./FeatureFlagsSection";
import ExportsSection from "./ExportsSection";

export default function CryptoDashboardWrapper() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      {/* Favorites at the top */}
      <FavoritesSection />

      {/* Main dashboard content */}
      <CryptoDashboard />

      {/* KV/R2 features in compact mode below */}
      <div className="w-full max-w-6xl mx-auto mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PageViewsSection compact />
          <FeatureFlagsSection compact />
          <ExportsSection compact />
        </div>
      </div>
    </QueryClientProvider>
  );
}

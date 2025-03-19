import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { RateLimit } from "../components/RateLimit";

export function RateLimitsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Navbar title="API Rate Limits" />
        <main className="container mx-auto p-4 md:p-6">
          <RateLimit />
        </main>
      </div>
    </div>
  );
} 
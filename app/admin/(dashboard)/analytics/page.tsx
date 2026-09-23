import { requireRole } from "@/lib/auth/session";
import {
  getBookingsPerDay,
  getRevenuePerDay,
  getTopProducts,
  getTotals,
} from "@/lib/analytics/repository";
import { formatPriceCents } from "@/lib/shop/format";
import Card from "@/components/ui/Card";
import BarChart from "./BarChart";

export default async function AnalyticsPage() {
  await requireRole(["OWNER", "ADMIN"]);

  const [totals, bookingsPerDay, revenuePerDay, topProducts] = await Promise.all([
    getTotals(),
    getBookingsPerDay(30),
    getRevenuePerDay(30),
    getTopProducts(5),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-light">Analytics</h1>
          <p className="text-sm text-muted">This month, and the last 30 days.</p>
        </div>
        <a
          href="https://analytics.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring tracked-label text-white/70 transition hover:text-white"
        >
          Visitor traffic (Google Analytics) →
        </a>
      </div>

      <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Bookings", value: totals.bookingsThisMonth },
          { label: "Revenue", value: formatPriceCents(totals.revenueThisMonthCents, "eur") },
          { label: "Active products", value: totals.activeProducts },
          { label: "Subscribers", value: totals.subscriberCount },
        ].map((stat) => (
          <Card key={stat.label}>
            <p className="text-2xl font-light">{stat.value}</p>
            <p className="tracked-label mt-1 text-muted">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="mb-12">
        <h2 className="mb-4 text-lg font-light">Bookings per day (30d)</h2>
        <BarChart bars={bookingsPerDay.map((d) => ({ label: d.day, value: d.count }))} />
      </div>

      <div className="mb-12">
        <h2 className="mb-4 text-lg font-light">Revenue per day (30d)</h2>
        <BarChart
          bars={revenuePerDay.map((d) => ({ label: d.day, value: d.totalCents }))}
          formatValue={(v) => formatPriceCents(v, "eur")}
        />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-light">Top products (units sold)</h2>
        {topProducts.length === 0 ? (
          <p className="text-sm text-muted">No paid orders yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/10 border-y border-white/10">
            {topProducts.map((p) => (
              <li key={p.productId} className="flex items-center justify-between px-1 py-3">
                <span className="text-sm">{p.name}</span>
                <span className="tracked-label text-muted">{p.unitsSold} sold</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

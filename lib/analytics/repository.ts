import "server-only";

import { prisma } from "@/lib/prisma";

export type DailyCount = { day: string; count: number };
export type DailyRevenue = { day: string; totalCents: number };
export type TopProduct = { productId: string; name: string; unitsSold: number };

export async function getBookingsPerDay(days = 30): Promise<DailyCount[]> {
  return prisma.$queryRaw<DailyCount[]>`
    SELECT to_char(date_trunc('day', "start"), 'YYYY-MM-DD') as day, COUNT(*)::int as count
    FROM "Booking"
    WHERE "start" >= now() - make_interval(days => ${days})
    GROUP BY 1
    ORDER BY 1
  `;
}

export async function getRevenuePerDay(days = 30): Promise<DailyRevenue[]> {
  return prisma.$queryRaw<DailyRevenue[]>`
    SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') as day, SUM("totalCents")::int as "totalCents"
    FROM "Order"
    WHERE status IN ('PAID', 'FULFILLED') AND "createdAt" >= now() - make_interval(days => ${days})
    GROUP BY 1
    ORDER BY 1
  `;
}

export async function getTopProducts(limit = 5): Promise<TopProduct[]> {
  return prisma.$queryRaw<TopProduct[]>`
    SELECT oi."productId" as "productId", p.name as name, SUM(oi.quantity)::int as "unitsSold"
    FROM "OrderItem" oi
    JOIN "Order" o ON o.id = oi."orderId"
    JOIN "Product" p ON p.id = oi."productId"
    WHERE o.status IN ('PAID', 'FULFILLED')
    GROUP BY oi."productId", p.name
    ORDER BY "unitsSold" DESC
    LIMIT ${limit}
  `;
}

export type AnalyticsTotals = {
  bookingsThisMonth: number;
  revenueThisMonthCents: number;
  activeProducts: number;
  subscriberCount: number;
  newSubscribersThisMonth: number;
};

export async function getTotals(): Promise<AnalyticsTotals> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [bookingsThisMonth, revenueRow, activeProducts, subscriberCount, newSubscribersThisMonth] =
    await Promise.all([
      prisma.booking.count({ where: { start: { gte: startOfMonth } } }),
      prisma.order.aggregate({
        where: { status: { in: ["PAID", "FULFILLED"] }, createdAt: { gte: startOfMonth } },
        _sum: { totalCents: true },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
      prisma.newsletterSubscriber.count({
        where: { unsubscribedAt: null, subscribedAt: { gte: startOfMonth } },
      }),
    ]);

  return {
    bookingsThisMonth,
    revenueThisMonthCents: revenueRow._sum.totalCents ?? 0,
    activeProducts,
    subscriberCount,
    newSubscribersThisMonth,
  };
}

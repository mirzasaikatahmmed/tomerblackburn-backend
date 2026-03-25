import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SubmissionStatus } from 'generated/prisma/enums';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [total, pending, processing, completed, revenueResult] =
      await Promise.all([
        this.prisma.submission.count(),
        this.prisma.submission.count({
          where: { status: SubmissionStatus.PENDING },
        }),
        this.prisma.submission.count({
          where: { status: SubmissionStatus.PROCESSING },
        }),
        this.prisma.submission.count({
          where: { status: SubmissionStatus.COMPLETED },
        }),
        this.prisma.submission.aggregate({
          where: { status: SubmissionStatus.COMPLETED },
          _sum: { totalAmount: true },
        }),
      ]);

    const totalRevenueValue = revenueResult._sum.totalAmount;
    const totalRevenue =
      totalRevenueValue !== null && totalRevenueValue !== undefined
        ? Number(totalRevenueValue)
        : 0;

    return {
      message: 'Dashboard summary retrieved successfully',
      data: {
        totalSubmissions: total,
        pending,
        processing,
        completed,
        totalRevenue,
      },
    };
  }

  async getRevenueTrend(months?: string) {
    const rangeMonths = this.normalizeMonths(months);

    const now = new Date();
    const endDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
    const startDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (rangeMonths - 1), 1),
    );

    const rows = await this.prisma.$queryRaw<
      { month: Date; total: number | string | null }[]
    >`
      SELECT date_trunc('month', "submittedAt") AS month,
             SUM("totalAmount") AS total
      FROM "submissions"
      WHERE status = ${SubmissionStatus.COMPLETED}
        AND "submittedAt" >= ${startDate}
        AND "submittedAt" < ${endDate}
      GROUP BY 1
      ORDER BY 1
    `;

    const totalsByMonth = new Map<string, number>();
    for (const row of rows) {
      const monthKey = this.toMonthKey(row.month);
      const value =
        row.total !== null && row.total !== undefined ? Number(row.total) : 0;
      totalsByMonth.set(monthKey, value);
    }

    const labels: string[] = [];
    const totals: number[] = [];
    for (let i = 0; i < rangeMonths; i += 1) {
      const monthDate = new Date(
        Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + i, 1),
      );
      const monthKey = this.toMonthKey(monthDate);
      labels.push(this.formatMonthLabel(monthDate));
      totals.push(totalsByMonth.get(monthKey) ?? 0);
    }

    return {
      message: 'Dashboard revenue trend retrieved successfully',
      data: {
        range: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          months: rangeMonths,
        },
        labels,
        totals,
      },
    };
  }

  private normalizeMonths(months?: string) {
    const parsed = months ? Number(months) : 12;
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 12;
    }

    return Math.min(Math.max(Math.trunc(parsed), 1), 36);
  }

  private toMonthKey(date: Date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private formatMonthLabel(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }
}

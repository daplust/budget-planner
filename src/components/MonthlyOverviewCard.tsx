import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatIDR } from '@/lib/currency';
import type { MonthlyOverview } from '@/types';

interface MonthlyOverviewCardProps {
  overview: MonthlyOverview;
}

export function MonthlyOverviewCard({ overview }: MonthlyOverviewCardProps) {
  const {
    totalIncome,
    totalAllocated,
    totalSpent,
    totalRemaining,
    percentage,
    daysRemaining,
  } = overview;

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <span className="text-xl sm:text-2xl">📊</span>
          Monthly Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Income</p>
            <p className="text-base sm:text-lg font-bold text-green-600 break-words">
              {formatIDR(totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Allocated</p>
            <p className="text-base sm:text-lg font-bold break-words">
              {formatIDR(totalAllocated)}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Spent</p>
            <p className="text-base sm:text-lg font-bold text-blue-600 break-words">
              {formatIDR(totalSpent)}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Remaining</p>
            <p className="text-base sm:text-lg font-bold text-emerald-600 break-words">
              {formatIDR(totalRemaining)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={percentage} className="h-3" />
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-medium">{percentage.toFixed(1)}% used</span>
            <span className="text-muted-foreground">
              {daysRemaining} days remaining
            </span>
          </div>
        </div>

        {percentage > 80 && daysRemaining > 7 && (
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-950 p-2 sm:p-3 text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ You're spending faster than usual this month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

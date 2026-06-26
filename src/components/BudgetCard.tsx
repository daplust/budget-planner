import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatIDR } from '@/lib/currency';
import { calculateBudget, getStatusColor } from '@/lib/calculations';
import type { BudgetCategory } from '@/types';

interface BudgetCardProps {
  category: BudgetCategory;
  allocated: number;
  spent: number;
  onClick?: () => void;
}

export function BudgetCard({ category, allocated, spent, onClick }: BudgetCardProps) {
  const { remaining, percentage, status, isOverBudget } = calculateBudget(allocated, spent);
  const statusColor = getStatusColor(status);

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg active:scale-[0.98]"
      onClick={onClick}
      style={{ borderTopColor: category.color, borderTopWidth: '4px' }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <span className="text-xl sm:text-2xl">{category.icon}</span>
          {category.name}
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground break-words">
          {formatIDR(allocated)} allocated
        </p>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div>
          <Progress
            value={percentage}
            className="h-2"
            style={{
              // @ts-ignore
              '--progress-background': statusColor,
            } as React.CSSProperties}
          />
          <p className="mt-2 text-xs sm:text-sm font-medium" style={{ color: statusColor }}>
            {percentage.toFixed(1)}% used
          </p>
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm">
          <div>
            <p className="text-muted-foreground">Used</p>
            <p className="font-semibold break-words">{formatIDR(spent)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">
              {isOverBudget ? 'Over' : 'Remaining'}
            </p>
            <p className="font-semibold break-words" style={{ color: isOverBudget ? '#EF4444' : '#10B981' }}>
              {formatIDR(Math.abs(remaining))}
            </p>
          </div>
        </div>

        <div className="pt-2">
          <div
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
            }}
          >
            {status === 'safe' && '✅ On Track'}
            {status === 'warning' && '⚠️ Watch Out'}
            {status === 'danger' && '⚠️ Almost Over'}
            {status === 'over' && '❌ Over Budget'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

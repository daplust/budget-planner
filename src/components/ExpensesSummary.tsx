import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBudgetStore } from '@/store/budgetStore';
import { formatIDR } from '@/lib/currency';
import { TrendingUp, TrendingDown, Minus, Tag } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import type { BudgetCategory, Expense } from '@/types';

interface ExpensesSummaryProps {
  expenses: Expense[];
  categories: BudgetCategory[];
  currentMonth: string;
}

export function ExpensesSummary({ expenses, categories, currentMonth }: ExpensesSummaryProps) {
  const { getTotalSpent, budgets, expenses: allExpenses } = useBudgetStore();

  // Current month stats
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const expenseCount = expenses.length;
  const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

  // Previous month comparison
  const prevMonth = format(subMonths(new Date(currentMonth + '-01'), 1), 'yyyy-MM');
  const prevMonthExpenses = allExpenses.filter(exp => exp.month === prevMonth);
  const prevMonthTotal = prevMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const monthlyChange = prevMonthTotal > 0 
    ? ((totalExpenses - prevMonthTotal) / prevMonthTotal) * 100 
    : 0;

  // Breakdown by tags
  const tagBreakdown = new Map<string, { count: number; total: number }>();
  expenses.forEach(exp => {
    if (exp.tags && exp.tags.length > 0) {
      exp.tags.forEach(tag => {
        const existing = tagBreakdown.get(tag) || { count: 0, total: 0 };
        tagBreakdown.set(tag, {
          count: existing.count + 1,
          total: existing.total + exp.amount,
        });
      });
    } else {
      // Untagged expenses
      const existing = tagBreakdown.get('Untagged') || { count: 0, total: 0 };
      tagBreakdown.set('Untagged', {
        count: existing.count + 1,
        total: existing.total + exp.amount,
      });
    }
  });

  // Sort tags by total amount
  const sortedTags = Array.from(tagBreakdown.entries())
    .sort((a, b) => b[1].total - a[1].total);

  // Budget usage by category
  const categoryUsage = categories.map(cat => {
    const budget = budgets.find(b => b.categoryId === cat.id);
    const spent = getTotalSpent(cat.id!);
    const percentage = budget && budget.allocated > 0 
      ? (spent / budget.allocated) * 100 
      : 0;
    
    return {
      category: cat,
      budget: budget?.allocated || 0,
      spent,
      percentage,
    };
  }).filter(item => item.budget > 0);

  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-semibold">Expenses Summary</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatIDR(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        {/* Number of Expenses */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Number of Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenseCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Transactions
            </p>
          </CardContent>
        </Card>

        {/* Average Expense */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatIDR(averageExpense)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per transaction
            </p>
          </CardContent>
        </Card>

        {/* Monthly Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              vs Last Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {monthlyChange > 0 ? (
                <>
                  <TrendingUp className="w-5 h-5 text-red-500" />
                  <span className="text-2xl font-bold text-red-500">
                    +{monthlyChange.toFixed(1)}%
                  </span>
                </>
              ) : monthlyChange < 0 ? (
                <>
                  <TrendingDown className="w-5 h-5 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">
                    {monthlyChange.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <Minus className="w-5 h-5 text-muted-foreground" />
                  <span className="text-2xl font-bold text-muted-foreground">
                    0%
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {prevMonthTotal > 0 ? formatIDR(prevMonthTotal) : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by Tags */}
      {sortedTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Breakdown by Tags/Labels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedTags.map(([tag, data]) => {
                const percentage = (data.total / totalExpenses) * 100;
                return (
                  <div key={tag} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tag}</span>
                        <span className="text-xs text-muted-foreground">
                          ({data.count} {data.count === 1 ? 'expense' : 'expenses'})
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatIDR(data.total)}</div>
                        <div className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Usage by Category */}
      {categoryUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Budget Usage by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryUsage.map((item) => {
                const getStatusColor = (percentage: number) => {
                  if (percentage >= 100) return 'text-red-500';
                  if (percentage >= 80) return 'text-yellow-500';
                  return 'text-green-500';
                };

                const getBarColor = (percentage: number) => {
                  if (percentage >= 100) return 'bg-red-500';
                  if (percentage >= 80) return 'bg-yellow-500';
                  return 'bg-green-500';
                };

                return (
                  <div key={item.category.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{item.category.icon}</span>
                        <span className="font-medium">{item.category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatIDR(item.spent)} / {formatIDR(item.budget)}
                        </div>
                        <div className={`text-xs font-semibold ${getStatusColor(item.percentage)}`}>
                          {item.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${getBarColor(item.percentage)}`}
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {expenseCount === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No expenses recorded this month
          </CardContent>
        </Card>
      )}
    </div>
  );
}

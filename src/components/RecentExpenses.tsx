import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIDR } from '@/lib/currency';
import { format } from 'date-fns';
import type { Expense, BudgetCategory } from '@/types';

interface RecentExpensesProps {
  expenses: Expense[];
  categories: BudgetCategory[];
  limit?: number;
}

export function RecentExpenses({ expenses, categories, limit = 5 }: RecentExpensesProps) {
  const recentExpenses = expenses.slice(0, limit);

  const getCategoryById = (id: string) => {
    return categories.find((cat) => cat.id === id);
  };

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📅</span>
            Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No expenses recorded</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <span className="text-xl sm:text-2xl">📅</span>
          Recent Expenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 sm:space-y-3">
          {recentExpenses.map((expense) => {
            const category = getCategoryById(expense.categoryId);
            return (
              <div
                key={expense.id}
                className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors gap-2"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <span className="text-xl sm:text-2xl flex-shrink-0">{category?.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base truncate">{expense.description}</p>
                    <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="whitespace-nowrap">{format(expense.date, 'MMM dd, yyyy')}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="truncate">{category?.name}</span>
                    </div>
                  </div>
                </div>
                <p className="font-semibold text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
                  {formatIDR(expense.amount)}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

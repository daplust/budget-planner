import type { BudgetStatus, BudgetCalculation, MonthlyOverview } from '../types';
import { endOfMonth, differenceInDays, getDaysInMonth } from 'date-fns';

/**
 * Calculate budget status based on spent percentage
 */
export function getBudgetStatus(percentage: number): BudgetStatus {
  if (percentage < 50) return 'safe';
  if (percentage < 80) return 'warning';
  if (percentage < 100) return 'danger';
  return 'over';
}

/**
 * Get status color based on budget status
 */
export function getStatusColor(status: BudgetStatus): string {
  const colors: Record<BudgetStatus, string> = {
    safe: '#10B981',
    warning: '#F59E0B',
    danger: '#F97316',
    over: '#EF4444',
  };
  return colors[status];
}

/**
 * Calculate budget details for a category
 */
export function calculateBudget(
  allocated: number,
  spent: number
): BudgetCalculation {
  const remaining = allocated - spent;
  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
  const status = getBudgetStatus(percentage);
  const isOverBudget = remaining < 0;

  return {
    allocated,
    spent,
    remaining,
    percentage: Math.min(percentage, 100),
    status,
    isOverBudget,
  };
}

/**
 * Calculate monthly overview statistics
 */
export function calculateMonthlyOverview(
  totalIncome: number,
  totalAllocated: number,
  totalSpent: number,
  currentDate: Date = new Date()
): MonthlyOverview {
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = getDaysInMonth(currentDate);
  const daysRemaining = Math.max(0, differenceInDays(monthEnd, currentDate) + 1);
  const daysPassed = daysInMonth - daysRemaining;

  const totalRemaining = totalAllocated - totalSpent;
  const percentage = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
  
  const averageDailySpending = daysPassed > 0 ? totalSpent / daysPassed : 0;
  const projectedMonthlySpending = averageDailySpending * daysInMonth;

  return {
    totalIncome,
    totalAllocated,
    totalSpent,
    totalRemaining,
    percentage: Math.min(percentage, 100),
    daysInMonth,
    daysRemaining,
    averageDailySpending,
    projectedMonthlySpending,
  };
}

/**
 * Calculate savings rate percentage
 */
export function calculateSavingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0;
  const savings = income - expenses;
  return (savings / income) * 100;
}

/**
 * Calculate goal progress
 */
export function calculateGoalProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min((current / target) * 100, 100);
}

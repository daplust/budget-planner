export type CategoryType = 'daily-needs' | 'lifestyle' | 'investment' | 'custom';

export type IncomeType = 'salary' | 'bonus' | 'side-income' | 'other';

export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly';

export type BudgetStatus = 'safe' | 'warning' | 'danger' | 'over';

// Base interface with cloud sync fields
export interface CloudSyncBase {
  id?: string; // Firestore document ID (optional for new items)
  userId: string; // Owner user ID
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date; // Last successful cloud sync
  deviceId?: string; // Device that created/modified the record
  isDeleted?: boolean; // Soft delete flag for sync
}

export interface BudgetCategory extends CloudSyncBase {
  name: string;
  type: CategoryType;
  color: string;
  icon?: string;
  order: number;
}

export interface Income extends CloudSyncBase {
  amount: number;
  date: Date;
  description: string;
  type: IncomeType;
  recurring: boolean;
  recurringFrequency?: RecurringFrequency;
  month: string; // Format: 'YYYY-MM'
  isExcluded?: boolean; // Flag to indicate if this income should be excluded from budget calculations
}

export interface Budget extends CloudSyncBase {
  sourceId?: string; // Optional reference to the source of the budget (e.g., income ID)
  month: string; // Format: 'YYYY-MM'
  categoryId: string;
  allocated: number;
  spent: number; // Calculated from expenses
  rolloverEnabled: boolean;
  rolloverAmount?: number;
}

export interface Expense extends CloudSyncBase {
  date: string; // Can be a string or Date object
  categoryId: string;
  amount: number;
  description: string;
  tags?: string[];
  recurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  receiptUrl?: string;
  notes?: string;
  month: string; // Format: 'YYYY-MM'
}

export interface SavingsGoal extends CloudSyncBase {
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  priority: number;
  categoryId?: string;
  color?: string;
}

export interface BudgetCalculation {
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
  isOverBudget: boolean;
}

export interface MonthlyOverview {
  totalIncome: number;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  percentage: number;
  daysInMonth: number;
  daysRemaining: number;
  averageDailySpending: number;
  projectedMonthlySpending: number;
}

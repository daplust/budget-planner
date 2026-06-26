import Dexie, { type EntityTable } from 'dexie';
import type { BudgetCategory, Income, Budget, Expense, SavingsGoal } from '../types';
import { generateUUID } from './uuid';

// Sync queue item for offline operations
export interface SyncQueueItem {
  id?: number;
  collection: 'categories' | 'income' | 'budgets' | 'expenses' | 'goals';
  operation: 'create' | 'update' | 'delete';
  documentId?: string; // Firestore document ID
  data: any;
  timestamp: Date;
  retryCount: number;
  error?: string;
}

const db = new Dexie('BudgetPlannerDB') as Dexie & {
  categories: EntityTable<BudgetCategory, 'id'>;
  income: EntityTable<Income, 'id'>;
  budgets: EntityTable<Budget, 'id'>;
  expenses: EntityTable<Expense, 'id'>;
  goals: EntityTable<SavingsGoal, 'id'>;
  syncQueue: EntityTable<SyncQueueItem, 'id'>;
};

// local cache
db.version(1).stores({
  categories: 'id, name, type, order, userId',
  income: 'id, date, type, amount, userId, month',
  budgets: 'id, month, categoryId, allocated, userId',
  expenses: 'id, date, categoryId, amount, userId, month, *tags',
  goals: 'id, name, targetAmount, deadline, priority, userId',
  syncQueue: '++id, collection, operation, timestamp',
});

// Initialize default categories if database is empty - first time only
export async function initializeDefaultData(userId: string) {
  const count = await db.categories.count();
  
  if (count === 0) {
    const defaultCategories: Partial<BudgetCategory>[] = [
      {
        id: generateUUID(),
        name: 'Daily Needs',
        type: 'daily-needs',
        color: 'hsl(221, 83%, 53%)',
        icon: '🛒',
        order: 1,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: generateUUID(),
        name: 'Lifestyle',
        type: 'lifestyle',
        color: 'hsl(142, 71%, 45%)',
        icon: '☕',
        order: 2,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: generateUUID(),
        name: 'Investment',
        type: 'investment',
        color: 'hsl(262, 83%, 58%)',
        icon: '📈',
        order: 3,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.categories.bulkAdd(defaultCategories as BudgetCategory[]);
  }
}

// Clear local cache
export async function clearLocalCache() {
  await Promise.all([
    db.categories.clear(),
    db.income.clear(),
    db.budgets.clear(),
    db.expenses.clear(),
    db.goals.clear(),
  ]);
}

// Clear sync queue
export async function clearSyncQueue() {
  await db.syncQueue.clear();
}

export default db;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BudgetCategory, Income, Budget, Expense, SavingsGoal } from '../types';
import { format } from 'date-fns';
import { where } from 'firebase/firestore';
import {
  categoriesService,
  incomeService,
  budgetsService,
  expensesService,
  goalsService,
  syncAllQueued,
} from '../lib/firestore';
import { getCurrentUser, onAuthChange } from '../lib/auth';
import { clearLocalCache } from '../lib/db';
import { migrateCategoryIcons } from '../lib/migrations';

// to initialize default categories in Firestore for new users
async function initializeDefaultCategories(
  addCategory: (category: any) => Promise<void>
) {
  console.log('🆕 Creating default categories...');
  const defaultCategories = [
    {
      name: 'Daily Needs',
      type: 'daily-needs' as const,
      color: 'hsl(221, 83%, 53%)',
      icon: '🛒',
      order: 1,
    },
    {
      name: 'Lifestyle',
      type: 'lifestyle' as const,
      color: 'hsl(142, 71%, 45%)',
      icon: '☕',
      order: 2,
    },
    {
      name: 'Investment',
      type: 'investment' as const,
      color: 'hsl(262, 83%, 58%)',
      icon: '📈',
      order: 3,
    },
  ];

  for (const category of defaultCategories) {
    try {
      await addCategory(category);
    } catch (error) {
      console.error('Failed to create default category:', category.name, error);
    }
  }
}

interface BudgetStore {
  // State
  categories: BudgetCategory[];
  income: Income[];
  budgets: Budget[];
  expenses: Expense[];
  goals: SavingsGoal[];
  currentMonth: string;
  isLoading: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  user: any | null;
  isInitialized: boolean;

  // Realtime subscriptions
  unsubscribeAll: (() => void)[];

  // Auth
  setUser: (user: any | null) => Promise<void>;
  signOut: () => Promise<void>;

  // Categories
  loadCategories: () => Promise<void>;
  addCategory: (category: Omit<BudgetCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'syncedAt'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<BudgetCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  cleanupDuplicateCategories: () => Promise<{ deleted: number; updated: { budgets: number; expenses: number } }>;

  // Income
  loadIncome: () => Promise<void>;
  addIncome: (income: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'month'>) => Promise<void>;
  updateIncome: (id: string, updates: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;

  // Budgets
  loadBudgets: (month?: string) => Promise<void>;
  setBudget: (budget: Omit<Budget, 'id' | 'userId' | 'spent' | 'createdAt' | 'updatedAt' | 'syncedAt'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Expenses
  loadExpenses: (month?: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'month'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Goals
  loadGoals: () => Promise<void>;
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'syncedAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Utility
  setCurrentMonth: (month: string) => void;
  initialize: () => Promise<void>;
  enableRealtimeSync: () => void;
  syncToCloud: () => Promise<void>;
  getTotalSpent: (categoryId: string, month?: string) => number;
  getTotalIncome: (month?: string) => number;
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      // Initial state
      categories: [],
      income: [],
      budgets: [],
      expenses: [],
      goals: [],
      currentMonth: format(new Date(), 'yyyy-MM'),
      isLoading: false,
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSyncTime: null,
      user: null,
      isInitialized: false,
      unsubscribeAll: [],

      // Set user and trigger sync
      setUser: async (user) => {
        set({ user });
        if (user) {
          // Wait for initialization to complete before enabling realtime sync
          await get().initialize();
          get().enableRealtimeSync();
          get().syncToCloud();
        }
      },

      // Sign out and clear local data
      signOut: async () => {
        get().unsubscribeAll.forEach(unsub => unsub());
        
        await clearLocalCache();
        
        // Reset state
        set({
          categories: [],
          income: [],
          budgets: [],
          expenses: [],
          goals: [],
          user: null,
          isInitialized: false,
          unsubscribeAll: [],
        });
      },

      initialize: async () => {
        // Prevent duplicate initialization
        if (get().isInitialized) {
          console.log('⏭️ Already initialized, skipping...');
          return;
        }
        
        set({ isLoading: true });
        const user = getCurrentUser();
        
        if (!user) {
          set({ isLoading: false });
          return;
        }

        console.log('🔄 Loading data from Firestore...');
        await Promise.all([
          get().loadCategories(),
          get().loadIncome(),
          get().loadBudgets(),
          get().loadExpenses(),
          get().loadGoals(),
        ]);
        
        console.log('📋 Loaded categories:', get().categories.length);
        
        // Run migrations for existing data (only if there are categories)
        if (get().categories.length > 0) {
          await migrateCategoryIcons();

          await get().loadCategories();
        }
        
        // Initialize default categories in Firestore if new user (no categories)
        if (get().categories.length === 0) {
          console.log('No categories found, creating defaults...');
          await initializeDefaultCategories(get().addCategory);
          // Reload categories after creation
          await get().loadCategories();
          console.log('📋 Categories after initialization:', get().categories.length);
        }
        
        set({ isLoading: false, isInitialized: true });
        console.log('✅ Initialization complete');
      },

      // Enable realtime sync from Firestore
      enableRealtimeSync: () => {
        const user = getCurrentUser();
        if (!user) return;

        const unsubscribes: (() => void)[] = [];

        // Subscribe to categories
        unsubscribes.push(
          categoriesService.subscribe((categories) => {
            // Sort in memory to avoid composite index
            set({ categories: categories.sort((a, b) => a.order - b.order) });
          }, [])
        );

        // Subscribe to income
        unsubscribes.push(
          incomeService.subscribe((income) => {
            // Sort in memory to avoid composite index
            set({ income: income.sort((a, b) => b.date.getTime() - a.date.getTime()) });
          }, [])
        );

        // Subscribe to budgets for current month
        const currentMonth = get().currentMonth;
        unsubscribes.push(
          budgetsService.subscribe((budgets) => {
            set({ budgets });
          }, [where('month', '==', currentMonth)])
        );

        // Subscribe to expenses for current month
        unsubscribes.push(
          expensesService.subscribe((expenses) => {
            // Sort in memory to avoid composite index
            set({ expenses: expenses.sort((a, b) => b.date.getTime() - a.date.getTime()) });
          }, [where('month', '==', currentMonth)])
        );

        // Subscribe to goals
        unsubscribes.push(
          goalsService.subscribe((goals) => {
            // Sort in memory to avoid composite index
            set({ goals: goals.sort((a, b) => a.priority - b.priority) });
          }, [])
        );

        set({ unsubscribeAll: unsubscribes, lastSyncTime: new Date() });
      },

      // Sync queued operations to cloud
      syncToCloud: async () => {
        const user = getCurrentUser();
        if (!user || !navigator.onLine) return;

        set({ isSyncing: true });
        
        try {
          await syncAllQueued();
          set({ lastSyncTime: new Date() });
        } catch (error) {
          console.error('Sync failed:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // Categories - Cloud-first operations
      loadCategories: async () => {
        try {
          const categories = await categoriesService.getAll([]);
          // Sort in memory to avoid composite index
          const sorted = categories.sort((a, b) => a.order - b.order);
          console.log('📊 loadCategories - Found:', sorted.length, sorted);
          set({ categories: sorted });
        } catch (error) {
          console.error('Failed to load categories:', error);
        }
      },

      addCategory: async (category) => {
        try {
          await categoriesService.create(category as any);
          // Realtime listener will update state automatically
        } catch (error) {
          console.error('Failed to add category:', error);
          throw error;
        }
      },

      updateCategory: async (id, updates) => {
        try {
          await categoriesService.update(id, updates);
          // Realtime listener will update state automatically
        } catch (error) {
          console.error('Failed to update category:', error);
          throw error;
        }
      },

      deleteCategory: async (id) => {
        try {
          await categoriesService.delete(id);
          // Realtime listener will update state automatically
        } catch (error) {
          console.error('Failed to delete category:', error);
          throw error;
        }
      },

      cleanupDuplicateCategories: async () => {
        console.log('🧹 Starting duplicate category cleanup...');
        const allCategories = get().categories;
        
        if (allCategories.length === 0) {
          console.log('⚠️ No categories to cleanup');
          return { deleted: 0, updated: { budgets: 0, expenses: 0 } };
        }

        // Group categories by name (case-insensitive)
        const categoryGroups = new Map<string, BudgetCategory[]>();
        allCategories.forEach(cat => {
          const key = cat.name.toLowerCase();
          if (!categoryGroups.has(key)) {
            categoryGroups.set(key, []);
          }
          categoryGroups.get(key)!.push(cat);
        });

        let deletedCount = 0;
        let updatedBudgets = 0;
        let updatedExpenses = 0;

        // Process each group
        for (const [name, categories] of categoryGroups) {
          if (categories.length <= 1) continue; // No duplicates

          console.log(`🔍 Found ${categories.length} categories with name "${name}"`);

          // Sort by createdAt (oldest first) and keep the first one
          const sorted = [...categories].sort((a, b) => 
            a.createdAt.getTime() - b.createdAt.getTime()
          );
          const keepCategory = sorted[0];
          const deleteCategories = sorted.slice(1);

          console.log(`✅ Keeping category: ${keepCategory.id} (created: ${keepCategory.createdAt})`);
          console.log(`🗑️  Deleting ${deleteCategories.length} duplicates`);

          // Update all budgets and expenses that reference deleted categories
          for (const deleteCat of deleteCategories) {
            // Update budgets
            const budgetsToUpdate = get().budgets.filter(b => b.categoryId === deleteCat.id);
            for (const budget of budgetsToUpdate) {
              if (!budget.id) continue;
              try {
                await budgetsService.update(budget.id, { categoryId: keepCategory.id! });
                updatedBudgets++;
                console.log(`✏️  Updated budget ${budget.id} to reference ${keepCategory.id}`);
              } catch (error) {
                console.error('Failed to update budget:', error);
              }
            }

            // Update expenses
            const expensesToUpdate = get().expenses.filter(e => e.categoryId === deleteCat.id);
            for (const expense of expensesToUpdate) {
              if (!expense.id) continue;
              try {
                await expensesService.update(expense.id, { categoryId: keepCategory.id! });
                updatedExpenses++;
                console.log(`✏️  Updated expense ${expense.id} to reference ${keepCategory.id}`);
              } catch (error) {
                console.error('Failed to update expense:', error);
              }
            }

            // Delete the duplicate category
            if (deleteCat.id) {
              try {
                await categoriesService.delete(deleteCat.id);
                deletedCount++;
                console.log(`🗑️  Deleted duplicate category: ${deleteCat.id}`);
              } catch (error) {
                console.error('Failed to delete category:', error);
              }
            }
          }
        }

        // Reload categories to reflect changes
        await get().loadCategories();
        await get().loadBudgets();
        await get().loadExpenses();

        console.log(`✅ Cleanup complete! Deleted: ${deletedCount}, Updated budgets: ${updatedBudgets}, Updated expenses: ${updatedExpenses}`);
        return { deleted: deletedCount, updated: { budgets: updatedBudgets, expenses: updatedExpenses } };
      },

      // Income
      loadIncome: async () => {
        try {
          const income = await incomeService.getAll([]);
          // Sort in memory to avoid composite index
          set({ income: income.sort((a, b) => b.date.getTime() - a.date.getTime()) });
        } catch (error) {
          console.error('Failed to load income:', error);
        }
      },

      addIncome: async (income) => {
        try {
          const month = format(income.date, 'yyyy-MM');
          await incomeService.create({ ...income, month } as any);
        } catch (error) {
          console.error('Failed to add income:', error);
          throw error;
        }
      },

      updateIncome: async (id, updates) => {
        try {
          await incomeService.update(id, updates);
        } catch (error) {
          console.error('Failed to update income:', error);
          throw error;
        }
      },

      deleteIncome: async (id) => {
        try {
          await incomeService.delete(id);
        } catch (error) {
          console.error('Failed to delete income:', error);
          throw error;
        }
      },

      // Budgets
      loadBudgets: async (month) => {
        const targetMonth = month || get().currentMonth;
        try {
          const budgets = await budgetsService.getAll([where('month', '==', targetMonth)]);
          set({ budgets });
        } catch (error) {
          console.error('Failed to load budgets:', error);
        }
      },

      setBudget: async (budget) => {
        try {
          // Check if budget exists
          const existing = get().budgets.find(
            b => b.month === budget.month && b.categoryId === budget.categoryId
          );

          if (existing && existing.id) {
            await budgetsService.update(existing.id, budget);
          } else {
            await budgetsService.create({ ...budget, spent: 0 } as any);
          }
        } catch (error) {
          console.error('Failed to set budget:', error);
          throw error;
        }
      },

      updateBudget: async (id, updates) => {
        try {
          await budgetsService.update(id, updates);
        } catch (error) {
          console.error('Failed to update budget:', error);
          throw error;
        }
      },

      deleteBudget: async (id) => {
        try {
          await budgetsService.delete(id);
        } catch (error) {
          console.error('Failed to delete budget:', error);
          throw error;
        }
      },

      // Expenses
      loadExpenses: async (month) => {
        const targetMonth = month || get().currentMonth;
        try {
          const expenses = await expensesService.getAll([
            where('month', '==', targetMonth)
          ]);
          // Sort in memory to avoid composite index
          set({ expenses: expenses.sort((a, b) => b.date.getTime() - a.date.getTime()) });
        } catch (error) {
          console.error('Failed to load expenses:', error);
        }
      },

      addExpense: async (expense) => {
        try {
          const month = format(expense.date, 'yyyy-MM');
          await expensesService.create({ ...expense, month } as any);
          // Note: budget.spent is calculated on-demand via getTotalSpent(), not stored
        } catch (error) {
          console.error('Failed to add expense:', error);
          throw error;
        }
      },

      updateExpense: async (id, updates) => {
        try {
          await expensesService.update(id, updates);
        } catch (error) {
          console.error('Failed to update expense:', error);
          throw error;
        }
      },

      deleteExpense: async (id) => {
        try {
          await expensesService.delete(id);
          // Note: budget.spent is calculated on-demand via getTotalSpent(), not stored
        } catch (error) {
          console.error('Failed to delete expense:', error);
          throw error;
        }
      },

      // Goals
      loadGoals: async () => {
        try {
          const goals = await goalsService.getAll([]);
          // Sort in memory to avoid composite index
          set({ goals: goals.sort((a, b) => a.priority - b.priority) });
        } catch (error) {
          console.error('Failed to load goals:', error);
        }
      },

      addGoal: async (goal) => {
        try {
          await goalsService.create(goal as any);
        } catch (error) {
          console.error('Failed to add goal:', error);
          throw error;
        }
      },

      updateGoal: async (id, updates) => {
        try {
          await goalsService.update(id, updates);
        } catch (error) {
          console.error('Failed to update goal:', error);
          throw error;
        }
      },

      deleteGoal: async (id) => {
        try {
          await goalsService.delete(id);
        } catch (error) {
          console.error('Failed to delete goal:', error);
          throw error;
        }
      },

      // Utility
      setCurrentMonth: (month) => {
        set({ currentMonth: month });
        get().loadBudgets(month);
        get().loadExpenses(month);
      },

      getTotalSpent: (categoryId, month) => {
        const targetMonth = month || get().currentMonth;
        return get()
          .expenses.filter((expense) => {
            return expense.categoryId === categoryId && expense.month === targetMonth;
          })
          .reduce((sum, expense) => sum + expense.amount, 0);
      },

      getTotalIncome: (month) => {
        const targetMonth = month || get().currentMonth;
        return get()
          .income.filter((inc) => inc.month === targetMonth)
          .reduce((sum, inc) => sum + inc.amount, 0);
      },
    }),
    {
      name: 'budget-storage',
      partialize: (state) => ({
        currentMonth: state.currentMonth,
      }),
    }
  )
);

// Listen for online/offline events
window.addEventListener('online', () => {
  useBudgetStore.setState({ isOnline: true });
  useBudgetStore.getState().syncToCloud();
});

window.addEventListener('offline', () => {
  useBudgetStore.setState({ isOnline: false });
});

// Listen for auth state changes
onAuthChange((user) => {
  useBudgetStore.getState().setUser(user);
});

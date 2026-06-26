import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
  type QueryConstraint,
} from 'firebase/firestore'
import { db as firestore } from './firebase'
import { getCurrentUser } from './auth'
import type { BudgetCategory, Income, Budget, Expense, SavingsGoal, CloudSyncBase } from '../types'
import localDb, { type SyncQueueItem } from './db'
import { generateUUID } from './uuid'

// Device ID for conflict resolution
const DEVICE_ID = generateUUID()

// Helper to convert Firestore timestamps to Dates
function convertTimestamps<T extends CloudSyncBase>(data: any): T {
  return {
    ...data,
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    syncedAt: data.syncedAt?.toDate?.() || data.syncedAt,
  } as T
}

// Generic CRUD operations for cloud-first architecture

export class FirestoreService<T extends CloudSyncBase> {
  private collectionName: 'categories' | 'income' | 'budgets' | 'expenses' | 'goals';

  constructor(collectionName: 'categories' | 'income' | 'budgets' | 'expenses' | 'goals') {
    this.collectionName = collectionName;
  }

  private getCollectionRef() {
    const user = getCurrentUser()
    if (!user) throw new Error('User not authenticated')
    return collection(firestore, 'users', user.uid, this.collectionName)
  }

  // CREATE: Add document to Firestore (cloud-first)
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt'>): Promise<T> {
    const user = getCurrentUser()
    if (!user) {
      // If offline, queue for sync
      await this.queueOperation('create', undefined, data)
      throw new Error('Offline: Operation queued for sync')
    }

    try {
      const collectionRef = this.getCollectionRef()
      const now = Timestamp.now()
      
      const docData = {
        ...data,
        userId: user.uid,
        deviceId: DEVICE_ID,
        createdAt: now,
        updatedAt: now,
        syncedAt: now,
        isDeleted: false,
      }

      const docRef = await addDoc(collectionRef, docData)
      
      const created = {
        ...docData,
        id: docRef.id,
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
        syncedAt: now.toDate(),
      } as T

      // Cache locally
      await this.cacheLocally(created)
      
      return created
    } catch (error) {
      console.error('Firestore create failed:', error)
      // Queue for sync when back online
      await this.queueOperation('create', undefined, data)
      throw error
    }
  }

  // READ: Get all documents (cloud-first, fallback to cache)
  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    const user = getCurrentUser()
    if (!user) {
      // Offline: return from local cache
      return this.getAllFromCache()
    }

    try {
      const collectionRef = this.getCollectionRef()
      const q = query(
        collectionRef,
        where('isDeleted', '==', false),
        ...constraints
      )
      
      const snapshot = await getDocs(q)
      const documents = snapshot.docs.map(doc => 
        convertTimestamps<T>({ id: doc.id, ...doc.data() })
      )

      // Update local cache
      await this.updateCache(documents)
      
      return documents
    } catch (error) {
      console.error('Firestore read failed, using cache:', error)
      // Fallback to cache
      return this.getAllFromCache()
    }
  }

  // READ: Get single document by ID
  async getById(id: string): Promise<T | null> {
    const user = getCurrentUser()
    if (!user) {
      return this.getFromCache(id)
    }

    try {
      const docRef = doc(firestore, 'users', user.uid, this.collectionName, id)
      const snapshot = await getDoc(docRef)
      
      if (!snapshot.exists()) return null
      
      const document = convertTimestamps<T>({ id: snapshot.id, ...snapshot.data() })
      
      // Cache locally
      await this.cacheLocally(document)
      
      return document
    } catch (error) {
      console.error('Firestore read failed, using cache:', error)
      return this.getFromCache(id)
    }
  }

  // UPDATE: Update document in Firestore
  async update(id: string, data: Partial<T>): Promise<void> {
    const user = getCurrentUser()
    if (!user) {
      await this.queueOperation('update', id, data)
      throw new Error('Offline: Operation queued for sync')
    }

    try {
      const docRef = doc(firestore, 'users', user.uid, this.collectionName, id)
      const updateData = {
        ...data,
        updatedAt: Timestamp.now(),
        syncedAt: Timestamp.now(),
        deviceId: DEVICE_ID,
      }
      
      await updateDoc(docRef, updateData)
      
      // Update cache
      await this.updateCacheItem(id, updateData)
    } catch (error) {
      console.error('Firestore update failed:', error)
      await this.queueOperation('update', id, data)
      throw error
    }
  }

  // DELETE: Soft delete in Firestore
  async delete(id: string): Promise<void> {
    const user = getCurrentUser()
    if (!user) {
      await this.queueOperation('delete', id, {})
      throw new Error('Offline: Operation queued for sync')
    }

    try {
      const docRef = doc(firestore, 'users', user.uid, this.collectionName, id)
      await updateDoc(docRef, {
        isDeleted: true,
        updatedAt: Timestamp.now(),
        deviceId: DEVICE_ID,
      })
      
      // Remove from cache
      await this.removeFromCache(id)
    } catch (error) {
      console.error('Firestore delete failed:', error)
      await this.queueOperation('delete', id, {})
      throw error
    }
  }

  // REAL-TIME: Subscribe to changes
  subscribe(callback: (documents: T[]) => void, constraints: QueryConstraint[] = []): Unsubscribe {
    const user = getCurrentUser()
    if (!user) {
      // Return cached data once and empty unsubscribe
      this.getAllFromCache().then(callback)
      return () => {}
    }

    const collectionRef = this.getCollectionRef()
    const q = query(
      collectionRef,
      where('isDeleted', '==', false),
      ...constraints
    )

    return onSnapshot(q, (snapshot) => {
      const documents = snapshot.docs.map(doc =>
        convertTimestamps<T>({ id: doc.id, ...doc.data() })
      )
      
      // Update cache in background
      this.updateCache(documents).catch(console.error)
      
      callback(documents)
    }, (error) => {
      console.error('Firestore subscription error:', error)
      // Fallback to cache on error
      this.getAllFromCache().then(callback)
    })
  }

  // SYNC: Process queued operations when back online
  async processSyncQueue(): Promise<void> {
    const user = getCurrentUser()
    if (!user) return

    const queue = await localDb.syncQueue
      .where('collection')
      .equals(this.collectionName)
      .toArray()

    for (const item of queue) {
      try {
        switch (item.operation) {
          case 'create':
            await this.create(item.data)
            break
          case 'update':
            if (item.documentId) {
              await this.update(item.documentId, item.data)
            }
            break
          case 'delete':
            if (item.documentId) {
              await this.delete(item.documentId)
            }
            break
        }
        
        // Remove from queue on success
        if (item.id) {
          await localDb.syncQueue.delete(item.id)
        }
      } catch (error) {
        console.error('Sync queue processing failed:', error)
        // Update retry count
        if (item.id) {
          await localDb.syncQueue.update(item.id, {
            retryCount: item.retryCount + 1,
            error: (error as Error).message,
          })
        }
      }
    }
  }

  // CACHE: Local IndexedDB operations
  private async cacheLocally(document: T): Promise<void> {
    const table = localDb[this.collectionName] as any
    await table.put(document)
  }

  private async updateCache(documents: T[]): Promise<void> {
    const table = localDb[this.collectionName] as any
    await table.bulkPut(documents)
  }

  private async updateCacheItem(id: string, data: Partial<T>): Promise<void> {
    const table = localDb[this.collectionName] as any
    await table.update(id, data)
  }

  private async removeFromCache(id: string): Promise<void> {
    const table = localDb[this.collectionName] as any
    await table.delete(id)
  }

  private async getFromCache(id: string): Promise<T | null> {
    const table = localDb[this.collectionName] as any
    return table.get(id) || null
  }

  private async getAllFromCache(): Promise<T[]> {
    const table = localDb[this.collectionName] as any
    return table.toArray()
  }

  private async queueOperation(
    operation: 'create' | 'update' | 'delete',
    documentId: string | undefined,
    data: any
  ): Promise<void> {
    const queueItem: SyncQueueItem = {
      collection: this.collectionName,
      operation,
      documentId,
      data,
      timestamp: new Date(),
      retryCount: 0,
    }
    await localDb.syncQueue.add(queueItem)
  }
}

// Export service instances
export const categoriesService = new FirestoreService<BudgetCategory>('categories')
export const incomeService = new FirestoreService<Income>('income')
export const budgetsService = new FirestoreService<Budget>('budgets')
export const expensesService = new FirestoreService<Expense>('expenses')
export const goalsService = new FirestoreService<SavingsGoal>('goals')

// Sync all queued operations
export async function syncAllQueued() {
  await Promise.all([
    categoriesService.processSyncQueue(),
    incomeService.processSyncQueue(),
    budgetsService.processSyncQueue(),
    expensesService.processSyncQueue(),
    goalsService.processSyncQueue(),
  ])
}

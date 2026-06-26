import { initializeApp } from 'firebase/app'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore with offline persistence
export const db = getFirestore(app)

// This allows reads from cache when offline
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence enabled in first tab only')
  } else if (err.code === 'unimplemented') {
    console.warn('Browser doesn\'t support persistence')
  }
})

// Initialize Authentication
export const auth = getAuth(app)

// Collection names (centralized for consistency)
export const COLLECTIONS = {
  USERS: 'users',
  CATEGORIES: 'categories',
  INCOME: 'income',
  BUDGETS: 'budgets',
  EXPENSES: 'expenses',
  GOALS: 'goals',
} as const

// Helper to get user-scoped collection path
export function getUserCollection(userId: string, collection: keyof typeof COLLECTIONS) {
  return `${COLLECTIONS.USERS}/${userId}/${collection.toLowerCase()}`
}

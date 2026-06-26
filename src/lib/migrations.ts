

import { categoriesService } from './firestore';

// Map old Lucide icon names to emoji
const ICON_MAP: Record<string, string> = {
  'ShoppingBasket': '🛒',
  'Shopping': '🛒',
  'Coffee': '☕',
  'TrendingUp': '📈',
  'Chart': '📈'
};

export async function migrateCategoryIcons(): Promise<void> {
  try {
    console.log('🔄 Checking for icon migration...');
    
    const categories = await categoriesService.getAll([]);
    
    for (const category of categories) {
      if (!category.id || !category.icon) continue;
      
      // Check if icon is an old Lucide name
      if (ICON_MAP[category.icon]) {
        const newIcon = ICON_MAP[category.icon];
        console.log(`🔄 Migrating ${category.name}: ${category.icon} → ${newIcon}`);
        
        await categoriesService.update(category.id, {
          icon: newIcon,
        });
      }
    }
    
    console.log('✅ Icon migration complete');
  } catch (error) {
    console.error('❌ Icon migration failed:', error);
  }
}

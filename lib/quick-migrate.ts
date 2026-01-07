import { db } from './firebase'
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore'

// Quick migration function - call this from browser console
export async function quickMigrate() {
  try {
    console.log('Starting quick migration...')
    
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(postsQuery)
    
    let updatedCount = 0
    
    for (const docSnapshot of snapshot.docs) {
      const postData = docSnapshot.data()
      const updates: any = {}
      
      // Add missing fields
      if (postData.upvotesCount === undefined) {
        updates.upvotesCount = 0
      }
      
      if (postData.upvotedBy === undefined) {
        updates.upvotedBy = []
      }
      
      if (postData.isSpotlight === undefined) {
        updates.isSpotlight = false
      }
      
      if (Object.keys(updates).length > 0) {
        const postRef = doc(db, 'posts', docSnapshot.id)
        await updateDoc(postRef, updates)
        updatedCount++
        console.log(`Updated post ${docSnapshot.id} with:`, updates)
      }
    }
    
    console.log(`Migration complete! Updated ${updatedCount} posts.`)
    return updatedCount
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).quickMigrate = quickMigrate
}

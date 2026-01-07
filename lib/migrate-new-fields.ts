import { db } from './firebase'
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore'

export async function migrateNewFields() {
  try {
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(postsQuery)
    
    const batch = []
    
    for (const docSnapshot of snapshot.docs) {
      const postData = docSnapshot.data()
      const updates: any = {}
      
      // Add upvotesCount if missing
      if (postData.upvotesCount === undefined) {
        updates.upvotesCount = 0
      }
      
      // Add upvotedBy if missing
      if (postData.upvotedBy === undefined) {
        updates.upvotedBy = []
      }
      
      // Add isSpotlight if missing
      if (postData.isSpotlight === undefined) {
        updates.isSpotlight = false
      }
      
      // Add spotlightDate if missing (optional)
      if (postData.spotlightDate === undefined && postData.isSpotlight) {
        updates.spotlightDate = null
      }
      
      if (Object.keys(updates).length > 0) {
        const postRef = doc(db, 'posts', docSnapshot.id)
        batch.push(updateDoc(postRef, updates))
      }
    }
    
    await Promise.all(batch)
    console.log(`Migrated ${batch.length} posts with new fields`)
    return batch.length
  } catch (error) {
    console.error('Error migrating posts:', error)
    throw error
  }
}

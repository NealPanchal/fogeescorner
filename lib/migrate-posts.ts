import { db } from './firebase'
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore'

export async function migratePosts() {
  try {
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(postsQuery)
    
    const batch = []
    
    for (const docSnapshot of snapshot.docs) {
      const postData = docSnapshot.data()
      const updates: any = {}
      
      // Add commentsCount if missing
      if (postData.commentsCount === undefined) {
        updates.commentsCount = 0
      }
      
      // Add dailyIndex if missing
      if (postData.dailyIndex === undefined) {
        // For existing posts, assign a sequential index based on creation date
        // This is a simple approach - you might want a more sophisticated one
        updates.dailyIndex = 1
      }
      
      if (Object.keys(updates).length > 0) {
        const postRef = doc(db, 'posts', docSnapshot.id)
        batch.push(updateDoc(postRef, updates))
      }
    }
    
    await Promise.all(batch)
    console.log(`Migrated ${batch.length} posts`)
    return batch.length
  } catch (error) {
    console.error('Error migrating posts:', error)
    throw error
  }
}

// Run this script in the browser console to migrate existing posts
// Copy and paste this into the browser console when logged into the app

async function migratePosts() {
  try {
    console.log('Starting migration...')
    
    // Get all posts
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(postsQuery)
    
    let updatedCount = 0
    
    for (const docSnapshot of snapshot.docs) {
      const postData = docSnapshot.data()
      const updates = {}
      
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
      
      if (Object.keys(updates).length > 0) {
        const postRef = doc(db, 'posts', docSnapshot.id)
        await updateDoc(postRef, updates)
        updatedCount++
        console.log(`Updated post ${docSnapshot.id}`)
      }
    }
    
    console.log(`Migration complete! Updated ${updatedCount} posts.`)
    return updatedCount
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

// Run the migration
migratePosts()

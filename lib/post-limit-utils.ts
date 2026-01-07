import { db } from './firebase'
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore'
import { DAILY_POST_LIMIT } from './post-limits'

// Utility functions for testing and verifying daily post limits

export async function getUserPostsForToday(userId: string) {
  try {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    
    const postsQuery = query(
      collection(db, 'posts'),
      where('userId', '==', userId),
      where('createdAt', '>=', today),
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(postsQuery)
    
    const todayPosts = snapshot.docs.filter(doc => {
      const postDate = doc.data().createdAt?.toDate()
      return postDate && postDate < tomorrow
    })
    
    return todayPosts.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }))
  } catch (error) {
    console.error("Error getting user's today posts:", error)
    return []
  }
}

export async function validateDailyPostLimit(userId: string): Promise<{
  isValid: boolean
  currentCount: number
  limit: number
  canPost: boolean
  postsToday: any[]
}> {
  const postsToday = await getUserPostsForToday(userId)
  const currentCount = postsToday.length
  const limit = DAILY_POST_LIMIT
  const canPost = currentCount < limit
  const isValid = true // Basic validation - could be extended

  return {
    isValid,
    currentCount,
    limit,
    canPost,
    postsToday
  }
}

export async function resetDailyPostsForTesting(userId: string) {
  // WARNING: This function should only be used for testing purposes
  // It will delete all posts made by the user today
  
  try {
    const postsToday = await getUserPostsForToday(userId)
    
    const deletePromises = postsToday.map(post => 
      deleteDoc(doc(db, 'posts', post.id))
    )
    
    await Promise.all(deletePromises)
    
    console.log(`Deleted ${postsToday.length} posts for user ${userId}`)
    return postsToday.length
  } catch (error) {
    console.error("Error resetting daily posts:", error)
    return 0
  }
}

export function getPostLimitStatusMessage(currentCount: number, limit: number): {
  message: string
  type: 'success' | 'warning' | 'error'
  canPost: boolean
} {
  if (currentCount >= limit) {
    return {
      message: `Daily post limit reached (${currentCount}/${limit}). Try again tomorrow.`,
      type: 'error',
      canPost: false
    }
  } else if (currentCount >= limit - 1) {
    return {
      message: `You have ${limit - currentCount} post remaining today (${currentCount}/${limit}).`,
      type: 'warning',
      canPost: true
    }
  } else {
    return {
      message: `You can post ${limit - currentCount} more times today (${currentCount}/${limit}).`,
      type: 'success',
      canPost: true
    }
  }
}

// Make these functions available in console for debugging
if (typeof window !== 'undefined') {
  (window as any).postLimitUtils = {
    getUserPostsForToday,
    validateDailyPostLimit,
    resetDailyPostsForTesting,
    getPostLimitStatusMessage,
    DAILY_POST_LIMIT
  }
}

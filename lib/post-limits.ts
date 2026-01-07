import { db } from './firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

export async function getUserTodayPostCount(userId: string): Promise<number> {
  try {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    
    // Use a simpler query first, then filter in memory if needed
    const postsQuery = query(
      collection(db, 'posts'),
      where('userId', '==', userId),
      where('createdAt', '>=', today),
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(postsQuery)
    
    // Filter out posts after tomorrow in memory (more efficient than complex query)
    const todayPosts = snapshot.docs.filter(doc => {
      const postDate = doc.data().createdAt?.toDate()
      return postDate && postDate < tomorrow
    })
    
    return todayPosts.length
  } catch (error) {
    console.error("Error getting user's today post count:", error)
    return 0
  }
}

export async function getNextDailyIndex(userId: string): Promise<number> {
  try {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    
    // Use a simpler query and find the max dailyIndex in memory
    const postsQuery = query(
      collection(db, 'posts'),
      where('userId', '==', userId),
      where('createdAt', '>=', today),
      orderBy('dailyIndex', 'desc'),
      limit(10) // Get more posts to find the right one
    )
    
    const snapshot = await getDocs(postsQuery)
    
    // Filter today's posts and find max dailyIndex
    const todayPosts = snapshot.docs.filter(doc => {
      const postDate = doc.data().createdAt?.toDate()
      return postDate && postDate < tomorrow
    })
    
    if (todayPosts.length === 0) {
      return 1
    }
    
    const maxIndex = Math.max(...todayPosts.map(doc => doc.data().dailyIndex || 0))
    return maxIndex + 1
  } catch (error) {
    console.error("Error getting next daily index:", error)
    return 1
  }
}

export const DAILY_POST_LIMIT = 2

import { db } from './firebase'
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore'
import type { Post } from '@/types'

export async function getTrendingPosts(limitCount: number = 5): Promise<Post[]> {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
  
  const trendingQuery = query(
    collection(db, 'posts'),
    where('createdAt', '>=', yesterday),
    orderBy('createdAt', 'desc')
  )
  
  const snapshot = await getDocs(trendingQuery)
  const posts = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Post[]
  
  // Calculate trending score: (upvotes × 2) + likes + comments
  const postsWithScore = posts.map(post => ({
    ...post,
    trendingScore: (post.upvotesCount || 0) * 2 + (post.likes || 0) + (post.commentsCount || 0)
  }))
  
  // Sort by trending score (descending) and return top posts
  return postsWithScore
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, limitCount)
}

export function subscribeToTrending(callback: (posts: Post[]) => void, limitCount: number = 5) {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
  // Use a simpler query without orderBy to avoid index requirement
  const trendingQuery = query(
    collection(db, 'posts'),
    where('createdAt', '>=', yesterday)
  )
  
  return onSnapshot(trendingQuery, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Post[]
    
    // Calculate trending score
    const postsWithScore = posts.map(post => ({
      ...post,
      trendingScore: (post.upvotesCount || 0) * 2 + (post.likes || 0) + (post.commentsCount || 0)
    }))
    
    // Sort by trending score and return top posts
    const trendingPosts = postsWithScore
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limitCount)
    
    callback(trendingPosts)
  })
}

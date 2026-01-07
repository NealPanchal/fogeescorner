import { db } from './firebase'
import { collection, query, where, orderBy, limit, getDocs, updateDoc, doc, onSnapshot } from 'firebase/firestore'
import type { Post } from '@/types'

export async function getCommunitySpotlight(): Promise<Post | null> {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  
  // First check if there's already a spotlight for today
  const existingSpotlightQuery = query(
    collection(db, 'posts'),
    where('isSpotlight', '==', true),
    where('spotlightDate', '>=', today),
    where('spotlightDate', '<', tomorrow),
    limit(1)
  )
  
  const existingSnapshot = await getDocs(existingSpotlightQuery)
  if (!existingSnapshot.empty) {
    const spotlightPost = existingSnapshot.docs[0]
    return {
      id: spotlightPost.id,
      ...spotlightPost.data()
    } as Post
  }
  
  // If no spotlight for today, find the post with highest upvotes
  const yesterday = new Date(today)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  
  const topPostQuery = query(
    collection(db, 'posts'),
    where('createdAt', '>=', yesterday),
    where('createdAt', '<', today),
    orderBy('upvotesCount', 'desc'),
    orderBy('createdAt', 'asc'), // Tie-breaker: earliest post
    limit(1)
  )
  
  const topPostSnapshot = await getDocs(topPostQuery)
  if (!topPostSnapshot.empty) {
    const topPost = topPostSnapshot.docs[0]
    const postRef = doc(db, 'posts', topPost.id)
    
    // Mark as spotlight
    await updateDoc(postRef, {
      isSpotlight: true,
      spotlightDate: today
    })
    
    return {
      id: topPost.id,
      ...topPost.data()
    } as Post
  }
  
  return null
}

export async function updateCommunitySpotlight(): Promise<void> {
  const spotlight = await getCommunitySpotlight()
  if (!spotlight) {
    // Try to create a new spotlight if none exists
    await getCommunitySpotlight()
  }
}

export function subscribeToSpotlight(callback: (spotlight: Post | null) => void) {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  
  const spotlightQuery = query(
    collection(db, 'posts'),
    where('isSpotlight', '==', true),
    where('spotlightDate', '>=', today),
    where('spotlightDate', '<', tomorrow),
    limit(1)
  )
  
  return onSnapshot(spotlightQuery, (snapshot) => {
    if (!snapshot.empty) {
      const spotlightPost = snapshot.docs[0]
      callback({
        id: spotlightPost.id,
        ...spotlightPost.data()
      } as Post)
    } else {
      callback(null)
    }
  })
}

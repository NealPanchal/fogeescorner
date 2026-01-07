import { db } from './firebase'
import { collection, addDoc, query, where, orderBy, onSnapshot, getDocs, doc, deleteDoc, updateDoc, increment, getDoc } from 'firebase/firestore'
import type { Upvote } from '@/types'

export function subscribeToUpvotes(postId: string, callback: (upvotes: Upvote[]) => void) {
  const upvotesQuery = query(
    collection(db, 'upvotes'),
    where('postId', '==', postId),
    orderBy('createdAt', 'desc')
  )
  
  return onSnapshot(upvotesQuery, (snapshot) => {
    const upvotes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Upvote[]
    callback(upvotes)
  })
}

export async function addUpvote(postId: string, userId: string) {
  // Check if user already upvoted
  const existingUpvoteQuery = query(
    collection(db, 'upvotes'),
    where('postId', '==', postId),
    where('userId', '==', userId)
  )
  
  const existingSnapshot = await getDocs(existingUpvoteQuery)
  if (!existingSnapshot.empty) {
    throw new Error('User has already upvoted this post')
  }

  // Get post details to check if user is trying to upvote their own post
  const postRef = doc(db, 'posts', postId)
  const postSnapshot = await getDoc(postRef)
  if (!postSnapshot.exists()) {
    throw new Error('Post not found')
  }
  
  const post = postSnapshot.data()
  if (post.userId === userId) {
    throw new Error('Cannot upvote your own post')
  }

  const upvoteData = {
    postId,
    userId,
    postUserId: post.userId, // Add this for security rules
    createdAt: new Date()
  }
  
  const upvoteRef = await addDoc(collection(db, 'upvotes'), upvoteData)
  
  // Update post upvote count
  await updateDoc(postRef, {
    upvotesCount: increment(1),
    upvotedBy: [...(post.upvotedBy || []), userId]
  })
  
  return upvoteRef.id
}

export async function removeUpvote(postId: string, userId: string) {
  const upvoteQuery = query(
    collection(db, 'upvotes'),
    where('postId', '==', postId),
    where('userId', '==', userId)
  )
  
  const snapshot = await getDocs(upvoteQuery)
  if (snapshot.empty) {
    throw new Error('Upvote not found')
  }
  
  const upvoteDoc = snapshot.docs[0]
  await deleteDoc(upvoteDoc.ref)
  
  // Update post upvote count
  const postRef = doc(db, 'posts', postId)
  const postSnapshot = await getDoc(postRef)
  if (postSnapshot.exists()) {
    const post = postSnapshot.data()
    await updateDoc(postRef, {
      upvotesCount: increment(-1),
      upvotedBy: (post.upvotedBy || []).filter((id: string) => id !== userId)
    })
  }
  
  return upvoteDoc.id
}

export async function getUserUpvotedPosts(userId: string): Promise<string[]> {
  const upvotesQuery = query(
    collection(db, 'upvotes'),
    where('userId', '==', userId)
  )
  
  const snapshot = await getDocs(upvotesQuery)
  return snapshot.docs.map(doc => doc.data().postId)
}

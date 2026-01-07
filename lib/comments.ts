import { db } from './firebase'
import { collection, addDoc, query, where, orderBy, onSnapshot, getDocs, doc, deleteDoc, updateDoc, increment } from 'firebase/firestore'
import type { Comment } from '@/types'

export function subscribeToComments(postId: string, callback: (comments: Comment[]) => void) {
  const commentsQuery = query(
    collection(db, 'comments'),
    where('postId', '==', postId),
    orderBy('createdAt', 'desc')
  )
  
  return onSnapshot(commentsQuery, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Comment[]
    callback(comments)
  })
}

export async function addComment(postId: string, userId: string, userName: string, userPhotoURL: string | null, content: string) {
  if (!content.trim()) {
    throw new Error('Comment cannot be empty')
  }
  
  const commentData = {
    postId,
    userId,
    userName,
    userPhotoURL,
    content: content.trim(),
    createdAt: new Date()
  }
  
  const commentRef = await addDoc(collection(db, 'comments'), commentData)
  
  // Update post comment count
  const postRef = doc(db, 'posts', postId)
  await updateDoc(postRef, {
    commentsCount: increment(1)
  })
  
  return commentRef.id
}

export async function deleteComment(commentId: string, postId: string) {
  await deleteDoc(doc(db, 'comments', commentId))
  
  // Update post comment count
  const postRef = doc(db, 'posts', postId)
  const commentsQuery = query(
    collection(db, 'comments'),
    where('postId', '==', postId)
  )
  const snapshot = await getDocs(commentsQuery)
  
  await updateDoc(postRef, {
    commentsCount: snapshot.size - 1
  })
}

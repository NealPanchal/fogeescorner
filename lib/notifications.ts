import { db } from './firebase'
import { collection, addDoc, query, where, orderBy, onSnapshot, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth } from './firebase'

export interface Notification {
  id: string
  userId: string
  type: 'like' | 'comment' | 'upvote' | 'follow' | 'spotlight' | 'trending'
  actorId: string
  actorName: string
  actorPhotoURL?: string | null
  postId?: string
  postContent?: string
  commentContent?: string
  read: boolean
  createdAt: any
}

export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
  if (!auth.currentUser) return

  try {
    const notificationData = {
      ...notification,
      createdAt: serverTimestamp(),
      read: false
    }
    
    return await addDoc(collection(db, 'notifications'), notificationData)
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

export async function notifyLike(postUserId: string, actorId: string, actorName: string, actorPhotoURL: string | null, postId: string, postContent: string) {
  if (postUserId === actorId) return // Don't notify for own likes

  await createNotification({
    userId: postUserId,
    type: 'like',
    actorId,
    actorName,
    actorPhotoURL,
    postId,
    postContent: postContent.length > 50 ? postContent.substring(0, 50) + '...' : postContent
  })
}

export async function notifyComment(postUserId: string, actorId: string, actorName: string, actorPhotoURL: string | null, postId: string, postContent: string, commentContent: string) {
  if (postUserId === actorId) return // Don't notify for own comments

  await createNotification({
    userId: postUserId,
    type: 'comment',
    actorId,
    actorName,
    actorPhotoURL,
    postId,
    postContent: postContent.length > 50 ? postContent.substring(0, 50) + '...' : postContent,
    commentContent: commentContent.length > 50 ? commentContent.substring(0, 50) + '...' : commentContent
  })
}

export async function notifyUpvote(postUserId: string, actorId: string, actorName: string, actorPhotoURL: string | null, postId: string, postContent: string) {
  if (postUserId === actorId) return // Don't notify for own upvotes

  await createNotification({
    userId: postUserId,
    type: 'upvote',
    actorId,
    actorName,
    actorPhotoURL,
    postId,
    postContent: postContent.length > 50 ? postContent.substring(0, 50) + '...' : postContent
  })
}

export async function notifyFollow(userId: string, actorId: string, actorName: string, actorPhotoURL: string | null) {
  if (userId === actorId) return // Don't notify for own follows

  await createNotification({
    userId,
    type: 'follow',
    actorId,
    actorName,
    actorPhotoURL
  })
}

export async function notifySpotlight(postUserId: string, postId: string, postContent: string) {
  await createNotification({
    userId: postUserId,
    type: 'spotlight',
    actorId: 'system',
    actorName: 'Fogees Corner',
    actorPhotoURL: null,
    postId,
    postContent: postContent.length > 50 ? postContent.substring(0, 50) + '...' : postContent
  })
}

export async function notifyTrending(postUserId: string, postId: string, postContent: string) {
  await createNotification({
    userId: postUserId,
    type: 'trending',
    actorId: 'system',
    actorName: 'Fogees Corner',
    actorPhotoURL: null,
    postId,
    postContent: postContent.length > 50 ? postContent.substring(0, 50) + '...' : postContent
  })
}

export function subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    orderBy('read', 'asc')
  )
  
  return onSnapshot(notificationsQuery, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[]
    callback(notifications)
  })
}

export async function markNotificationAsRead(notificationId: string) {
  const notificationRef = doc(db, 'notifications', notificationId)
  await updateDoc(notificationRef, { read: true })
}

export async function markAllNotificationsAsRead(userId: string) {
  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  )
  
  const snapshot = await getDocs(notificationsQuery)
  const batch = []
  
  for (const docSnapshot of snapshot.docs) {
    batch.push(updateDoc(docSnapshot.ref, { read: true }))
  }
  
  await Promise.all(batch)
}

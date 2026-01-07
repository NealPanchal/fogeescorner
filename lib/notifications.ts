import { db } from './firebase'
import { collection, addDoc, query, where, orderBy, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore'

export interface Notification {
  id: string
  userId: string
  type: 'upvote' | 'spotlight' | 'trending'
  postId: string
  postContent: string
  fromUserId?: string
  fromUserName?: string
  read: boolean
  createdAt: any
}

export async function createNotification(
  userId: string,
  type: 'upvote' | 'spotlight' | 'trending',
  postId: string,
  postContent: string,
  fromUserId?: string,
  fromUserName?: string
) {
  const notificationData = {
    userId,
    type,
    postId,
    postContent: postContent.length > 50 ? postContent.substring(0, 50) + '...' : postContent,
    fromUserId,
    fromUserName,
    read: false,
    createdAt: new Date()
  }
  
  return await addDoc(collection(db, 'notifications'), notificationData)
}

export function subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
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

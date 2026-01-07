import { db } from './firebase'
import { collection, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'
import type { UserSettings } from '@/types'

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const settingsRef = doc(db, 'userSettings', userId)
  const settingsDoc = await getDoc(settingsRef)
  
  if (settingsDoc.exists()) {
    return settingsDoc.data() as UserSettings
  }
  
  // Return default settings if none exist and save them
  const defaultSettings: UserSettings = {
    id: userId,
    userId,
    postingAndEngagement: {
      showDailyPostCounter: true,
      enableUpvotesOnMyPosts: true,
      enableCommentsOnMyPosts: true,
      confirmBeforePosting: false
    },
    privacy: {
      whoCanUpvoteMyPosts: 'everyone',
      whoCanComment: 'everyone'
    },
    notifications: {
      someoneUpvotedMyPost: true,
      myPostBecameCommunitySpotlight: true,
      myPostIsTrending: true
    },
    moderation: {
      hidePostsWithLowEngagement: false
    },
    updatedAt: new Date()
  }
  
  await setDoc(settingsRef, defaultSettings)
  return defaultSettings
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
  const settingsRef = doc(db, 'userSettings', userId)
  const updatedSettings = {
    ...settings,
    updatedAt: new Date()
  }
  
  await setDoc(settingsRef, updatedSettings, { merge: true })
}

export function subscribeToUserSettings(userId: string, callback: (settings: UserSettings) => void) {
  const settingsRef = doc(db, 'userSettings', userId)
  
  return onSnapshot(settingsRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UserSettings)
    }
  })
}

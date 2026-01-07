export interface Post {
  id: string
  userId: string
  userName: string
  userPhotoURL: string | null
  imageUrl?: string
  caption: string
  content?: string
  type: 'image' | 'text' | 'thread'
  threadId?: string
  likes: number
  likedBy: string[]
  commentsCount: number
  dailyIndex: number
  upvotesCount: number
  upvotedBy: string[]
  isSpotlight: boolean
  spotlightDate?: any
  createdAt: any
  isPostOfWeek?: boolean
  postOfWeekDate?: any
}

export interface UserProfile {
  id: string
  email: string
  displayName: string
  photoURL?: string | null
  bio?: string
  followers: string[]
  following: string[]
  createdAt: any
  updatedAt?: any
}

export interface UserSearchResult {
  id: string
  displayName: string
  photoURL?: string | null
  bio?: string
  isFollowing: boolean
}

export interface Comment {
  id: string
  postId: string
  userId: string
  userName: string
  userPhotoURL: string | null
  content: string
  createdAt: any
}

export interface Like {
  id: string
  postId: string
  userId: string
  createdAt: any
}

export interface Upvote {
  id: string
  postId: string
  userId: string
  postUserId: string
  createdAt: any
}

export interface UserSettings {
  id: string
  userId: string
  postingAndEngagement: {
    showDailyPostCounter: boolean
    enableUpvotesOnMyPosts: boolean
    enableCommentsOnMyPosts: boolean
    confirmBeforePosting: boolean
  }
  privacy: {
    whoCanUpvoteMyPosts: 'everyone' | 'followers'
    whoCanComment: 'everyone' | 'followers'
  }
  notifications: {
    someoneUpvotedMyPost: boolean
    myPostBecameCommunitySpotlight: boolean
    myPostIsTrending: boolean
  }
  moderation: {
    hidePostsWithLowEngagement: boolean
  }
  updatedAt: any
}

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

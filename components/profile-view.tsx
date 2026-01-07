"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { auth } from "@/lib/firebase"
import { ArrowLeft, UserPlus, UserCheck, Loader2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PostCard } from "@/components/post-card"
import { notifyFollow } from "@/lib/notifications"
import type { Post, UserProfile } from "@/types"

interface ProfileViewProps {
  userId: string
  onBack: () => void
  onSettingsClick: () => void
}

export function ProfileView({ userId, onBack, onSettingsClick }: ProfileViewProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const currentUser = auth.currentUser
    if (currentUser) {
      setCurrentUserId(currentUser.uid)
    }
  }, [])

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId))
        if (userDoc.exists()) {
          const profileData = userDoc.data() as UserProfile
          setUserProfile({ ...profileData, id: userDoc.id })
          
          // Check if current user is following this profile
          if (currentUserId && currentUserId !== userId) {
            const currentUserDoc = await getDoc(doc(db, "users", currentUserId))
            if (currentUserDoc.exists()) {
              const currentUserData = currentUserDoc.data()
              setIsFollowing((currentUserData.following || []).includes(userId))
            }
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      }
    }

    loadProfile()
  }, [userId, currentUserId])

  useEffect(() => {
    const postsQuery = query(
      collection(db, "posts"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const posts: Post[] = []
      snapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        } as Post)
      })
      setUserPosts(posts)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [userId])

  const handleFollow = async () => {
    if (!currentUserId || currentUserId === userId) return

    try {
      const userRef = doc(db, "users", currentUserId)
      const targetUserRef = doc(db, "users", userId)

      if (isFollowing) {
        // Unfollow
        await updateDoc(userRef, {
          following: arrayRemove(userId)
        })
        await updateDoc(targetUserRef, {
          followers: arrayRemove(currentUserId)
        })
        setIsFollowing(false)
      } else {
        // Follow
        await updateDoc(userRef, {
          following: arrayUnion(userId)
        })
        await updateDoc(targetUserRef, {
          followers: arrayUnion(currentUserId)
        })
        setIsFollowing(true)
        
        // Send notification to the user being followed
        const currentUser = auth.currentUser
        if (currentUser && userProfile) {
          await notifyFollow(
            userId,
            currentUserId,
            currentUser.displayName || "Anonymous",
            currentUser.photoURL || null
          )
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    )
  }

  const isOwnProfile = currentUserId === userId

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="touch-target">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold type-headline">Profile</h1>
      </div>

      {/* Profile Card */}
      <Card className="fogees-card overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
              <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName} />
              <AvatarFallback className="text-lg sm:text-xl">
                {userProfile.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold type-headline truncate">{userProfile.displayName}</h2>
              <p className="text-sm text-muted-foreground mb-2">
                {userProfile.followers?.length || 0} followers • {userProfile.following?.length || 0} following
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {isOwnProfile ? (
                  <Button onClick={onSettingsClick} className="touch-target">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                ) : (
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                    className="touch-target"
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        {userProfile.bio && (
          <CardContent className="pt-0">
            <div className="bg-secondary/30 rounded-lg p-4">
              <p className="text-sm type-body leading-relaxed">{userProfile.bio}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Posts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold type-headline">Posts</h3>
          <div className="text-sm text-muted-foreground">
            {userPosts.length} {userPosts.length === 1 ? 'post' : 'posts'}
          </div>
        </div>
        {userPosts.length > 0 ? (
          <div className="space-y-4">
            {userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId || undefined}
                currentUser={auth.currentUser}
              />
            ))}
          </div>
        ) : (
          <Card className="fogees-card">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground type-body">No posts yet</p>
              {isOwnProfile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Share your first post to get started!
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

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
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      {/* Profile Card */}
      <Card className="fogees-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName} />
                <AvatarFallback className="text-lg">
                  {userProfile.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{userProfile.displayName}</h2>
                <p className="text-sm text-muted-foreground">
                  {userProfile.followers?.length || 0} followers • {userProfile.following?.length || 0} following
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {isOwnProfile ? (
                <Button onClick={onSettingsClick}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              ) : (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollow}
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
        </CardHeader>
        {userProfile.bio && (
          <CardContent className="pt-0">
            <p className="text-sm">{userProfile.bio}</p>
          </CardContent>
        )}
      </Card>

      {/* Posts */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Posts</h3>
        {userPosts.length > 0 ? (
          userPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId || undefined}
              currentUser={auth.currentUser}
            />
          ))
        ) : (
          <Card className="fogees-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No posts yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

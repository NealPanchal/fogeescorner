"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { auth } from "@/lib/firebase"
import { ArrowLeft, UserPlus, UserCheck, Calendar, Users, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PostCard } from "@/components/post-card"
import { formatDistanceToNow } from "date-fns"
import type { UserProfile, Post } from "@/types"

export function UserProfile() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

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
    if (!userId) return

    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId))
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile
          setUserProfile({
            ...userData,
            id: userDoc.id
          })

          if (currentUserId && userData.followers?.includes(currentUserId)) {
            setIsFollowing(true)
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [userId, currentUserId])

  useEffect(() => {
    if (!userId) return

    const postsQuery = query(
      collection(db, "posts"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[]
      setUserPosts(postsData)
    })

    return () => unsubscribe()
  }, [userId])

  const handleFollow = async () => {
    if (!currentUserId || !userId) return

    try {
      const currentUserRef = doc(db, "users", currentUserId)
      const targetUserRef = doc(db, "users", userId)

      if (isFollowing) {
        await updateDoc(currentUserRef, {
          following: arrayRemove(userId)
        })
        await updateDoc(targetUserRef, {
          followers: arrayRemove(currentUserId)
        })
        setIsFollowing(false)
      } else {
        await updateDoc(currentUserRef, {
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="text-center py-12">
        <p>User not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const isOwnProfile = currentUserId === userId

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
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
                <h1 className="text-2xl font-bold">{userProfile.displayName}</h1>
                {userProfile.bio && (
                  <p className="text-muted-foreground mt-1">{userProfile.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDistanceToNow(userProfile.createdAt.toDate(), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
            
            {!isOwnProfile && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollow}
                className="flex items-center gap-2"
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="h-4 w-4" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-6 text-center">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{userProfile.followers?.length || 0}</span>
              <span className="text-muted-foreground text-sm">Followers</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{userProfile.following?.length || 0}</span>
              <span className="text-muted-foreground text-sm">Following</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{userPosts.length}</span>
              <span className="text-muted-foreground text-sm">Posts</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Posts</h2>
        {userPosts.length > 0 ? (
          <div className="space-y-4">
            {userPosts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={currentUserId || undefined} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No posts yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

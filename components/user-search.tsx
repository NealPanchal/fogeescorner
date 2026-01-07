"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { auth } from "@/lib/firebase"
import { Search, UserPlus, UserCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { UserSearchResult } from "@/types"

interface UserSearchProps {
  onProfileView: (userId: string) => void
}

export function UserSearch({ onProfileView }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [followingIds, setFollowingIds] = useState<string[]>([])

  useEffect(() => {
    const fetchFollowing = async () => {
      const user = auth.currentUser
      if (!user) return

      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setFollowingIds(userData.following || [])
      }
    }

    fetchFollowing()
  }, [])

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      // Get all users first, then filter in memory for better search
      const usersRef = collection(db, "users")
      const querySnapshot = await getDocs(usersRef)
      const results: UserSearchResult[] = []
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data()
        if (doc.id !== auth.currentUser?.uid) {
          const displayName = userData.displayName || ""
          const bio = userData.bio || ""
          
          // Search in display name and bio (case-insensitive)
          const searchLower = query.toLowerCase()
          if (
            displayName.toLowerCase().includes(searchLower) ||
            bio.toLowerCase().includes(searchLower)
          ) {
            results.push({
              id: doc.id,
              displayName: displayName,
              photoURL: userData.photoURL || null,
              bio: bio,
              isFollowing: followingIds.includes(doc.id)
            })
          }
        }
      })
      
      // Sort by relevance (exact matches first, then by display name)
      results.sort((a, b) => {
        const aName = a.displayName.toLowerCase()
        const bName = b.displayName.toLowerCase()
        const searchLower = query.toLowerCase()
        
        // Exact matches first
        if (aName === searchLower && bName !== searchLower) return -1
        if (bName === searchLower && aName !== searchLower) return 1
        
        // Then alphabetical
        return aName.localeCompare(bName)
      })
      
      setSearchResults(results.slice(0, 10)) // Limit to 10 results
    } catch (error) {
      console.error("Error searching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (userId: string, isCurrentlyFollowing: boolean) => {
    const currentUser = auth.currentUser
    if (!currentUser) return

    try {
      const userRef = doc(db, "users", currentUser.uid)
      const targetUserRef = doc(db, "users", userId)

      if (isCurrentlyFollowing) {
        await updateDoc(userRef, {
          following: arrayRemove(userId)
        })
        await updateDoc(targetUserRef, {
          followers: arrayRemove(currentUser.uid)
        })
        setFollowingIds(prev => prev.filter(id => id !== userId))
      } else {
        await updateDoc(userRef, {
          following: arrayUnion(userId)
        })
        await updateDoc(targetUserRef, {
          followers: arrayUnion(currentUser.uid)
        })
        setFollowingIds(prev => [...prev, userId])
      }

      setSearchResults(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, isFollowing: !isCurrentlyFollowing }
            : user
        )
      )
    } catch (error) {
      console.error("Error toggling follow:", error)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="space-y-3">
        {searchResults.map((user) => (
          <Card key={user.id} className="transition-all hover:shadow-md cursor-pointer" onClick={() => onProfileView(user.id)}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
                  <AvatarFallback>
                    {user.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium text-sm">{user.displayName}</h4>
                  {user.bio && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant={user.isFollowing ? "outline" : "default"}
                onClick={(e) => {
                  e.stopPropagation()
                  handleFollow(user.id, user.isFollowing)
                }}
                className="flex items-center gap-2"
              >
                {user.isFollowing ? (
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
            </CardContent>
          </Card>
        ))}
      </div>

      {searchQuery && !loading && searchResults.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No users found for "{searchQuery}"</p>
        </div>
      )}
    </div>
  )
}

"use client"

import React, { useState, useEffect } from "react"
import { getTrendingPosts } from "@/lib/trending"
import { ExternalLink, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { db, collection, getDocs } from "@/lib/firebase"
import { auth } from "@/lib/firebase"
import type { Post } from "@/types"

interface MultiColumnLayoutProps {
  sidebar: ReactNode
  mainContent: ReactNode
  rightColumn?: ReactNode
  children?: ReactNode
}

export function MultiColumnLayout({ sidebar, mainContent, rightColumn }: MultiColumnLayoutProps) {
  return (
    <div className="min-h-screen bg-background main-gradient">
      <div className="flex">
        {/* Left Sidebar - Fixed */}
        <div className="fixed left-0 top-0 h-full w-64 lg:w-72 z-50">
          {sidebar}
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 lg:ml-64 lg:ml-72 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
            <div className="flex gap-6">
              
              {/* Center Column - Primary Feed */}
              <div className="flex-1 max-w-2xl min-w-0">
                {mainContent}
              </div>

              {/* Right Column - Optional */}
              {rightColumn && (
                <div className="hidden xl:block w-80 flex-shrink-0">
                  <div className="sticky top-6 space-y-6">
                    {rightColumn}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FeedColumn({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      {children}
    </div>
  )
}

export function RightColumnTrends() {
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load trending posts
        const posts = await getTrendingPosts(5)
        setTrendingPosts(posts)
        
        // Load suggested users from database
        const { collection, getDocs, auth } = await import('@/lib/firebase')
        const usersRef = collection(db, "users")
        const snapshot = await getDocs(usersRef)
        
        const users = snapshot.docs
          .map((doc: any) => ({ id: doc.id, ...doc.data() }))
          .filter((user: any) => user.id !== auth.currentUser?.uid) // Exclude current user
          .sort(() => Math.random() - 0.5) // Random order for variety
          .slice(0, 3) // Show 3 suggested users
        
        setSuggestedUsers(users)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="space-y-4">
      <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-6">
        <h3 className="type-headline text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Trending
        </h3>
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-muted-foreground py-4">Loading trending posts...</div>
          ) : trendingPosts.length > 0 ? (
            trendingPosts.map((post, index) => (
              <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group">
                <div className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {post.content || post.caption}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{post.userName}</span>
                    <span>⬆️ {post.upvotesCount || 0}</span>
                    <span>❤️ {post.likes || 0}</span>
                    <span>💬 {post.commentsCount || 0}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-4">No trending posts yet</div>
          )}
        </div>
      </div>

      <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-6">
        <h3 className="type-headline text-foreground mb-4">Suggested</h3>
        <div className="space-y-3">
          {suggestedUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        {user.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-sm text-foreground type-body">{user.displayName}</span>
              </div>
              <button className="text-xs text-primary hover:text-primary/80 type-link">Follow</button>
            </div>
          ))}
          {suggestedUsers.length === 0 && !loading && (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">No suggested users yet</p>
            </div>
          )}
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mx-auto"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

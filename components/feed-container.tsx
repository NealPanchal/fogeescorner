"use client"

import { useState, useEffect } from "react"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, type User } from "firebase/auth"
import { collection, query, orderBy, onSnapshot, where, limit } from "firebase/firestore"
import { AuthForm } from "@/components/auth-form"
import { ProfileEditForm } from "@/components/profile-edit-form"
import { EnhancedCreatePost } from "@/components/enhanced-create-post"
import { SidebarNavigation, MobileMenuToggle } from "@/components/sidebar-navigation"
import { MultiColumnLayout, FeedColumn, RightColumnTrends } from "@/components/multi-column-layout"
import { UserSearch } from "@/components/user-search"
import { PostCard } from "@/components/post-card"
import { HighlightedPost } from "@/components/highlighted-post"
import { CommunitySpotlight } from "@/components/community-spotlight"
import { TrendingPosts } from "@/components/trending-posts"
import { SettingsPage } from "@/components/settings-page"
import { ProfileView } from "@/components/profile-view"
import { Button } from "@/components/ui/button"
import { Settings, Loader2 } from "lucide-react"
import type { Post } from "@/types"

export function FeedContainer() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [highlightedPost, setHighlightedPost] = useState<Post | null>(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [currentView, setCurrentView] = useState<"feed" | "search" | "profile" | "settings">("feed")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribePosts: (() => void) | null = null
    let unsubscribeHighlight: (() => void) | null = null

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)

      if (currentUser) {
        const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"))
        unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
          const postsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Post[]
          setPosts(postsData)
        })

        const highlightQuery = query(
          collection(db, "posts"),
          where("isPostOfWeek", "==", true),
          orderBy("postOfWeekDate", "desc"),
          limit(1),
        )

        unsubscribeHighlight = onSnapshot(highlightQuery, (snapshot) => {
          if (!snapshot.empty) {
            setHighlightedPost({
              id: snapshot.docs[0].id,
              ...snapshot.docs[0].data(),
            } as Post)
          } else {
            setHighlightedPost(null)
          }
        })
      } else {
        if (unsubscribePosts) {
          unsubscribePosts()
          unsubscribePosts = null
        }
        if (unsubscribeHighlight) {
          unsubscribeHighlight()
          unsubscribeHighlight = null
        }
        setPosts([])
        setHighlightedPost(null)
      }
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribePosts) unsubscribePosts()
      if (unsubscribeHighlight) unsubscribeHighlight()
    }
  }, [])

  const handleViewChange = (view: string) => {
    setCurrentView(view as "feed" | "search" | "profile" | "settings")
  }

  const handleProfileView = (userId: string) => {
    setProfileUserId(userId)
    setCurrentView("profile")
  }

  const handleBackToFeed = () => {
    setCurrentView("feed")
    setProfileUserId(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  if (isEditingProfile) {
    return (
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit Profile</h2>
          <Button variant="ghost" size="sm" onClick={() => setIsEditingProfile(false)}>
            Cancel
          </Button>
        </div>
        <ProfileEditForm user={user} onComplete={() => setIsEditingProfile(false)} />
      </div>
    )
  }

  if (currentView === "settings") {
    return (
      <>
        <SidebarNavigation 
          currentView={currentView} 
          onViewChange={handleViewChange} 
          user={user}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />
        <div className="lg:ml-64 lg:ml-72">
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 lg:hidden">
            <MobileMenuToggle 
              isOpen={isMobileMenuOpen} 
              onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            />
          </div>
          <main className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
            <SettingsPage user={user} onBack={handleBackToFeed} />
          </main>
        </div>
      </>
    )
  }

  if (currentView === "profile" && profileUserId) {
    return (
      <>
        <SidebarNavigation 
          currentView={currentView} 
          onViewChange={handleViewChange} 
          user={user}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />
        <div className="lg:ml-64 lg:ml-72">
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 lg:hidden">
            <MobileMenuToggle 
              isOpen={isMobileMenuOpen} 
              onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            />
          </div>
          <main className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
            <ProfileView 
              userId={profileUserId} 
              onBack={handleBackToFeed}
              onSettingsClick={() => setCurrentView("settings")}
            />
          </main>
        </div>
      </>
    )
  }

  if (currentView === "search") {
    return (
      <>
        <SidebarNavigation 
          currentView={currentView} 
          onViewChange={handleViewChange} 
          user={user}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />
        <div className="lg:ml-64 lg:ml-72">
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 lg:hidden">
            <MobileMenuToggle 
              isOpen={isMobileMenuOpen} 
              onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            />
          </div>
          <main className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Search Users</h1>
              <UserSearch onProfileView={handleProfileView} />
            </div>
          </main>
        </div>
      </>
    )
  }

  return (
    <MultiColumnLayout
      sidebar={
        <SidebarNavigation 
          currentView={currentView} 
          onViewChange={handleViewChange} 
          user={user}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />
      }
      mainContent={
        <FeedColumn>
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 lg:hidden">
            <MobileMenuToggle 
              isOpen={isMobileMenuOpen} 
              onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            />
          </div>
          
          {currentView === "feed" && (
            <>
              <EnhancedCreatePost user={user} />

              <TrendingPosts />

              <CommunitySpotlight currentUserId={user.uid} currentUser={user} />

              {highlightedPost && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  <HighlightedPost post={highlightedPost} currentUserId={user.uid} currentUser={user} />
                  <div className="mt-8 border-b border-border/30" />
                </section>
              )}

              <div className="space-y-6">
                <div className="px-1">
                  <h3 className="text-[11px] text-primary type-eyebrow opacity-80">Global Feed</h3>
                </div>
                {posts.length > 0 ? (
                  posts
                    .filter((p) => p.id !== highlightedPost?.id)
                    .map((post) => (
                      <div key={post.id} data-post-id={post.id}>
                        <PostCard post={post} currentUserId={user.uid} currentUser={user} onProfileView={handleProfileView} />
                      </div>
                    ))
                ) : (
                  <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-12 text-center">
                    <p className="text-muted-foreground">No posts yet. Be the first to share a moment!</p>
                  </div>
                )}
              </div>
            </>
          )}
        </FeedColumn>
      }
      rightColumn={<RightColumnTrends />}
    />
  )
}

"use client"

import { useState, useEffect } from "react"
import { Star } from "lucide-react"
import { PostCard } from "./post-card"
import { subscribeToSpotlight } from "@/lib/spotlight"
import type { Post } from "@/types"

interface CommunitySpotlightProps {
  currentUserId: string | undefined
  currentUser?: any
}

export function CommunitySpotlight({ currentUserId, currentUser }: CommunitySpotlightProps) {
  const [spotlightPost, setSpotlightPost] = useState<Post | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToSpotlight(setSpotlightPost)
    return unsubscribe
  }, [])

  if (!spotlightPost) {
    return null
  }

  return (
    <div className="relative space-y-4 mb-6">
      <div className="flex items-center gap-2 px-1">
        <Star className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold tracking-tight text-foreground">🌟 Community Spotlight</h3>
      </div>
      <div className="overflow-hidden rounded-2xl ring-4 ring-primary/20 transition-all duration-500 hover:ring-primary/40">
        <PostCard post={spotlightPost} currentUserId={currentUserId} currentUser={currentUser} />
      </div>
      <div className="absolute -inset-4 -z-10 animate-pulse rounded-[2.5rem] bg-primary/5 blur-2xl" />
    </div>
  )
}

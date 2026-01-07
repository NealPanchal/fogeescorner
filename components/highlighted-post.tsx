"use client"

import type { Post } from "@/types"
import { PostCard } from "./post-card"
import { Trophy } from "lucide-react"

interface HighlightedPostProps {
  post: Post
  currentUserId: string | undefined
  currentUser?: any
}

export function HighlightedPost({ post, currentUserId, currentUser }: HighlightedPostProps) {
  return (
    <div className="relative space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Trophy className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold tracking-tight text-foreground">Post of the Week</h3>
      </div>
      <div className="overflow-hidden rounded-2xl ring-4 ring-primary/20 transition-all duration-500 hover:ring-primary/40">
        <PostCard post={post} currentUserId={currentUserId} currentUser={currentUser} />
      </div>
      <div className="absolute -inset-4 -z-10 animate-pulse rounded-[2.5rem] bg-primary/5 blur-2xl" />
    </div>
  )
}

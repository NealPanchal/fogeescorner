"use client"

import { useState, useEffect } from "react"
import { TrendingUp, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { subscribeToTrending } from "@/lib/trending"
import type { Post } from "@/types"

interface TrendingPostsProps {
  onPostClick?: (postId: string) => void
}

export function TrendingPosts({ onPostClick }: TrendingPostsProps) {
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToTrending(setTrendingPosts)
    return unsubscribe
  }, [])

  if (trendingPosts.length === 0) {
    return null
  }

  const handlePostClick = (postId: string) => {
    if (onPostClick) {
      onPostClick(postId)
    } else {
      // Scroll to post if it's on the page
      const element = document.querySelector(`[data-post-id="${postId}"]`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  return (
    <Card className="mb-6 border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">🔥 Trending Posts</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {trendingPosts.map((post, index) => (
          <div
            key={post.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group"
            onClick={() => handlePostClick(post.id)}
          >
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
              onClick={(e) => {
                e.stopPropagation()
                handlePostClick(post.id)
              }}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

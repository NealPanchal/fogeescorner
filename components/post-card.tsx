"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { doc, updateDoc, arrayUnion, arrayRemove, increment, deleteDoc } from "firebase/firestore"
import type { Post } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { ArrowBigUp, UserIcon, Loader2, Trash2, MessageSquare, Heart, ChevronUp } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { subscribeToComments, addComment } from "@/lib/comments"
import { addUpvote, removeUpvote } from "@/lib/upvotes"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface PostCardProps {
  post: Post
  currentUserId: string | undefined
  currentUser?: any
  onProfileView?: (userId: string) => void
}

export function PostCard({ post, currentUserId, currentUser, onProfileView }: PostCardProps) {
  const [loading, setLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)
  const [upvoteLoading, setUpvoteLoading] = useState(false)
  const isLiked = currentUserId ? post.likedBy?.includes(currentUserId) : false
  const isUpvoted = currentUserId ? post.upvotedBy?.includes(currentUserId) : false

  // Debug logging
  console.log('PostCard render:', {
    postId: post.id,
    upvotesCount: post.upvotesCount,
    upvotedBy: post.upvotedBy,
    isUpvoted,
    currentUserId
  })

  useEffect(() => {
    if (showComments) {
      const unsubscribe = subscribeToComments(post.id, setComments)
      return unsubscribe
    }
  }, [showComments, post.id])

  const handleAddComment = async () => {
    if (!currentUserId || !commentText.trim()) return

    setCommentLoading(true)
    try {
      await addComment(
        post.id,
        currentUserId,
        currentUser?.displayName || "Anonymous",
        currentUser?.photoURL || null,
        commentText.trim()
      )
      setCommentText("")
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setCommentLoading(false)
    }
  }

  const toggleLike = async () => {
    if (!currentUserId || loading) return

    setLoading(true)
    try {
      const postRef = doc(db, "posts", post.id)

      if (isLiked) {
        await updateDoc(postRef, {
          likedBy: arrayRemove(currentUserId),
          likes: increment(-1),
        })
      } else {
        await updateDoc(postRef, {
          likedBy: arrayUnion(currentUserId),
          likes: increment(1),
        })
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUpvote = async () => {
    if (!currentUserId || upvoteLoading || post.userId === currentUserId) {
      console.log('Upvote blocked:', { 
        hasCurrentUserId: !!currentUserId, 
        upvoteLoading, 
        isOwnPost: post.userId === currentUserId 
      })
      return
    }

    console.log('Toggling upvote:', { postId: post.id, userId: currentUserId, isUpvoted })
    
    setUpvoteLoading(true)
    try {
      if (isUpvoted) {
        await removeUpvote(post.id, currentUserId)
        console.log('Upvote removed')
      } else {
        await addUpvote(post.id, currentUserId)
        console.log('Upvote added')
      }
    } catch (error) {
      console.error("Error toggling upvote:", error)
    } finally {
      setUpvoteLoading(false)
    }
  }

  const deletePost = async () => {
    if (!currentUserId || post.userId !== currentUserId || isDeleting) return

    setIsDeleting(true)
    try {
      await deleteDoc(doc(db, "posts", post.id))
    } catch (error) {
      console.error("Error deleting post:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="post-enter fogees-card overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-4">
          <div 
            className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-background cursor-pointer hover:ring-primary/40 transition-colors"
            onClick={() => onProfileView?.(post.userId)}
          >
            {post.userPhotoURL ? (
              <img
                src={post.userPhotoURL || "/placeholder.svg"}
                alt={post.userName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary">
                <UserIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-base type-headline text-foreground">{post.userName}</span>
            <span className="text-[11px] text-muted-foreground type-eyebrow opacity-70">
              {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : "Just now"}
            </span>
          </div>
        </div>

        {currentUserId === post.userId && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete Post</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your post.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-secondary">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deletePost} className="bg-destructive text-white hover:bg-destructive/90">
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {post.type === "image" && post.imageUrl && (
          <div className="group relative w-full bg-secondary/30">
            <img
              src={post.imageUrl || "/placeholder.svg"}
              alt="Post"
              className="w-full object-cover transition-transform duration-700 group-hover:scale-105 max-h-[600px]"
            />
            {post.isPostOfWeek && (
              <div className="absolute top-4 right-4 rounded-full bg-primary/90 px-4 py-1.5 text-[9px] font-black tracking-widest text-primary-foreground uppercase shadow-sm backdrop-blur-md">
                Selected Entry
              </div>
            )}
          </div>
        )}
        
        {(post.type === "text" || post.type === "thread") && (
          <div className="p-6 bg-gradient-to-br from-secondary/20 to-background">
            {post.type === "thread" && (
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-xs text-primary type-eyebrow">Thread</span>
                {post.threadId && (
                  <span className="text-xs text-muted-foreground">
                    Reply to thread
                  </span>
                )}
              </div>
            )}
            <div className="prose prose-sm max-w-none">
              <p className="text-base text-foreground/95 whitespace-pre-wrap type-body">
                {post.content || post.caption}
              </p>
            </div>
          </div>
        )}

        {(post.type === "image" && (post.content || post.caption)) && (
          <div className="px-6 py-5">
            <p className="text-base text-foreground/95 type-body">{post.content || post.caption}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between px-6 py-5 border-t border-border/20 bg-secondary/10">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLike}
            disabled={!currentUserId || loading}
            className={`group flex items-center gap-3 transition-all duration-300 ${isLiked ? "text-red-500" : "text-muted-foreground hover:text-foreground"}`}
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${isLiked ? "bg-red-500/10" : "bg-secondary group-hover:bg-secondary/80"}`}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Heart
                  className={`h-6 w-6 transition-all duration-300 group-active:scale-125 ${isLiked ? "fill-current" : ""}`}
                />
              )}
            </div>
            <span className="text-base font-bold tabular-nums tracking-tight">{post.likes || 0}</span>
          </button>
          
          <button
            onClick={toggleUpvote}
            disabled={!currentUserId || upvoteLoading || post.userId === currentUserId}
            className={`group flex items-center gap-3 transition-all duration-300 ${isUpvoted ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${isUpvoted ? "bg-primary/20" : "bg-secondary group-hover:bg-secondary/80"}`}
            >
              {upvoteLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ChevronUp
                  className={`h-6 w-6 transition-all duration-300 group-active:scale-125 ${isUpvoted ? "fill-current" : ""}`}
                />
              )}
            </div>
            <span className="text-base font-bold tabular-nums tracking-tight">{post.upvotesCount || 0}</span>
          </button>
          
          <button
            onClick={() => setShowComments(!showComments)}
            className="group flex items-center gap-3 transition-all duration-300 text-muted-foreground hover:text-foreground"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl transition-all bg-secondary group-hover:bg-secondary/80">
              <MessageSquare className="h-6 w-6 transition-all duration-300 group-active:scale-125" />
            </div>
            <span className="text-base font-bold tabular-nums tracking-tight">{post.commentsCount || 0}</span>
          </button>
        </div>
      </CardFooter>
      
      {showComments && (
        <div className="border-t border-border/20 bg-secondary/5 p-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {currentUserId && (
            <div className="flex gap-3">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[60px] resize-none bg-background/50 border-border/50"
                maxLength={200}
              />
              <Button
                onClick={handleAddComment}
                disabled={!commentText.trim() || commentLoading}
                size="sm"
                className="px-4"
              >
                {commentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
              </Button>
            </div>
          )}
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-background/50">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    {comment.userPhotoURL ? (
                      <img src={comment.userPhotoURL} alt={comment.userName} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{comment.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(comment.createdAt?.toDate?.() || comment.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 break-words">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground text-sm py-4">
                {currentUserId ? "No comments yet. Be the first to comment!" : "No comments yet."}
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

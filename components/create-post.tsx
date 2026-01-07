"use client"

import type React from "react"
import { UserIcon, AlertCircle } from "lucide-react"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import type { User } from "firebase/auth"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { uploadToCloudinary } from "@/lib/cloudinary-upload"
import { ImagePlus, Loader2, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { getUserTodayPostCount, getNextDailyIndex, DAILY_POST_LIMIT } from "@/lib/post-limits"

interface CreatePostProps {
  user: User
}

export function CreatePost({ user }: CreatePostProps) {
  const [caption, setCaption] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [todayPostCount, setTodayPostCount] = useState(0)
  const [limitReached, setLimitReached] = useState(false)

  useEffect(() => {
    if (user) {
      getUserTodayPostCount(user.uid).then(count => {
        setTodayPostCount(count)
        setLimitReached(count >= DAILY_POST_LIMIT)
      })
    }
  }, [user])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const clearImage = () => {
    setImageFile(null)
    setPreviewUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile || loading || limitReached) return

    setLoading(true)
    try {
      const imageUrl = await uploadToCloudinary(imageFile)
      const dailyIndex = await getNextDailyIndex(user.uid)

      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0],
        userPhotoURL: user.photoURL || null,
        imageUrl,
        caption,
        type: 'image',
        content: caption,
        likes: 0,
        likedBy: [],
        commentsCount: 0,
        upvotesCount: 0,
        upvotedBy: [],
        dailyIndex,
        isSpotlight: false,
        createdAt: serverTimestamp(),
      })

      setCaption("")
      clearImage()
      setTodayPostCount(prev => prev + 1)
      setLimitReached(prev => prev || todayPostCount + 1 >= DAILY_POST_LIMIT)
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="fogees-card overflow-hidden">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                {user.photoURL ? (
                  <img
                    src={user.photoURL || "/placeholder.svg"}
                    alt={user.displayName || ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <span className="text-lg text-foreground block truncate type-headline">
                  {user.displayName || user.email?.split("@")[0]}
                </span>
              </div>
            </div>
            <Badge variant="secondary" className="font-mono">
              {todayPostCount}/{DAILY_POST_LIMIT}
            </Badge>
          </div>

          <Textarea
            placeholder="Record a thought..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="fogees-input min-h-[80px] w-full resize-none p-4 text-base font-medium placeholder:text-muted-foreground/60 focus-visible:ring-0 rounded-xl"
            maxLength={200}
          />

          {previewUrl && (
            <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-lg border border-border">
              <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="h-full w-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full"
                onClick={clearImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {limitReached && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              Daily post limit reached ({todayPostCount}/{DAILY_POST_LIMIT}). Try again tomorrow.
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <label
              htmlFor="post-image"
              className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ImagePlus className="h-5 w-5" />
              Add Image
              <input id="post-image" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
            </label>

            <Button type="submit" disabled={!imageFile || loading || limitReached} size="sm">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { db, storage } from "@/lib/firebase"
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth } from "@/lib/firebase"
import { Image, Type, MessageSquare, Send, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { uploadToCloudinary } from "@/lib/cloudinary-upload"
import { getUserTodayPostCount, getNextDailyIndex, DAILY_POST_LIMIT } from "@/lib/post-limits"
import { getUserSettings } from "@/lib/user-settings"
import { quickMigrate } from "@/lib/quick-migrate"

interface EnhancedCreatePostProps {
  user: any
  threadId?: string
  onPostCreated?: () => void
}

export function EnhancedCreatePost({ user, threadId, onPostCreated }: EnhancedCreatePostProps) {
  const [content, setContent] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [postType, setPostType] = useState<"image" | "text" | "thread">("text")
  const [loading, setLoading] = useState(false)
  const [showThreadInput, setShowThreadInput] = useState(false)
  const [todayPostCount, setTodayPostCount] = useState(0)
  const [limitReached, setLimitReached] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [userSettings, setUserSettings] = useState<any>(null)

  useEffect(() => {
    if (!threadId && user) {
      Promise.all([
        getUserTodayPostCount(user.uid),
        getUserSettings(user.uid)
      ]).then(([count, settings]) => {
        setTodayPostCount(count)
        setLimitReached(count >= DAILY_POST_LIMIT)
        setUserSettings(settings)
      })
    }
  }, [user, threadId])

  // Make migration available in console for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).quickMigrate = quickMigrate
    }
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !imageFile) return
    if (!threadId && limitReached) return

    // Check if confirmation is required
    if (userSettings?.postingAndEngagement?.confirmBeforePosting && !threadId) {
      setShowConfirmDialog(true)
      return
    }

    await performPost()
  }

  const performPost = async () => {
    setShowConfirmDialog(false)
    setLoading(true)
    try {
      let imageUrl = ""

      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile)
      }

      const dailyIndex = threadId ? 0 : await getNextDailyIndex(user.uid)

      const postData: any = {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userPhotoURL: user.photoURL,
        content: content.trim(),
        caption: content.trim(),
        type: postType,
        likes: 0,
        likedBy: [],
        commentsCount: 0,
        upvotesCount: 0,
        upvotedBy: [],
        dailyIndex,
        isSpotlight: false,
        createdAt: serverTimestamp(),
      }

      if (imageUrl) {
        postData.imageUrl = imageUrl
      }

      if (threadId) {
        postData.threadId = threadId
        postData.type = "thread"
      }

      if (postType === "thread" && !threadId) {
        const threadDoc = doc(collection(db, "posts"))
        await setDoc(threadDoc, postData)
        
        const firstPostId = threadDoc.id
        await setDoc(threadDoc, { ...postData, threadId: firstPostId })
      } else {
        const postDoc = doc(collection(db, "posts"))
        await setDoc(postDoc, postData)
      }

      setContent("")
      clearImage()
      setShowThreadInput(false)
      
      if (!threadId) {
        setTodayPostCount(prev => prev + 1)
        setLimitReached(prev => prev || todayPostCount + 1 >= DAILY_POST_LIMIT)
      }
      
      onPostCreated?.()
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full bg-card/80 backdrop-blur-sm border border-border/50 shadow-xl overflow-hidden">
      <CardHeader className="pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
              <AvatarFallback className="text-lg font-medium">
                {user.displayName?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <span className="text-lg text-foreground block truncate type-headline">
                {user.displayName}
              </span>
            </div>
          </div>
          {!threadId && userSettings?.postingAndEngagement?.showDailyPostCounter && (
            <Badge variant="secondary" className="font-mono">
              {todayPostCount}/{DAILY_POST_LIMIT}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={postType} onValueChange={(value) => setPostType(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 bg-card/50 border border-border/30">
              <TabsTrigger value="text" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
                <Type className="h-4 w-4" />
                <span className="hidden sm:inline type-link text-sm">Text</span>
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline type-link text-sm">Image</span>
              </TabsTrigger>
              <TabsTrigger value="thread" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline type-link text-sm">Thread</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4 mt-6">
              <Textarea
                placeholder="What's happening?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] resize-none text-base leading-relaxed bg-background/50 border-border/50 focus:border-primary/50 w-full"
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {content.length}/500 characters
                </span>
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-4 mt-6">
              <Textarea
                placeholder="Add a caption..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none text-base leading-relaxed bg-background/50 border-border/50 focus:border-primary/50 w-full"
                maxLength={200}
              />
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center bg-card/30">
                  <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Click to upload an image
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="max-w-xs mx-auto"
                  />
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-80 object-cover rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-4 right-4"
                    onClick={clearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="thread" className="space-y-4 mt-6">
              <Textarea
                placeholder="Start a thread..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[140px] resize-none text-base leading-relaxed bg-background/50 border-border/50 focus:border-primary/50 w-full"
                maxLength={300}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {content.length}/300 characters
                </span>
              </div>
              <div className="bg-card/30 rounded-lg p-4 border border-border/30">
                <p className="text-sm text-muted-foreground">
                  Threads allow you to connect multiple posts together. Others can reply to continue the conversation.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col gap-2 pt-4 border-t border-border/30">
            {!threadId && limitReached && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                Daily post limit reached ({todayPostCount}/{DAILY_POST_LIMIT}). Try again tomorrow.
              </div>
            )}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading || (!content.trim() && !imageFile) || (!threadId && limitReached)}
                className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                size="lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Send className="h-5 w-5" />
                )}
                {threadId ? "Reply" : "Post"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
      
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to post this? This will use one of your daily posts ({todayPostCount + 1}/{DAILY_POST_LIMIT}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performPost}>Post</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

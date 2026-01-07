"use client"

import type React from "react"

import { useState } from "react"
import { db } from "@/lib/firebase"
import { updateProfile, type User } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { uploadToCloudinary } from "@/lib/cloudinary-upload"
import { Camera, Loader2 } from "lucide-react"

interface ProfileEditFormProps {
  user: User
  onComplete: () => void
}

export function ProfileEditForm({ user, onComplete }: ProfileEditFormProps) {
  const [displayName, setDisplayName] = useState(user.displayName || "")
  const [bio, setBio] = useState("")
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>(user.photoURL || "")

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let photoURL = user.photoURL

      if (imageFile) {
        photoURL = await uploadToCloudinary(imageFile)
      }

      await updateProfile(user, {
        displayName,
        photoURL,
      })

      await setDoc(
        doc(db, "users", user.uid),
        {
          id: user.uid,
          displayName,
          photoURL,
          bio,
          email: user.email,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      onComplete()
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-muted">
            {previewUrl ? (
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Profile Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <label
            htmlFor="photo-upload"
            className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-muted"
          >
            <Camera className="h-4 w-4" />
            <input id="photo-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">Click the camera to change photo</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your public name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            className="resize-none"
            rows={3}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </form>
  )
}

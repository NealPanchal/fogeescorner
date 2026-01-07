"use client"

import type React from "react"

import { useState } from "react"
import { auth } from "@/lib/firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        if (displayName) {
          await updateProfile(userCredential.user, { displayName })
        }

        await setDoc(doc(db, "users", userCredential.user.uid), {
          id: userCredential.user.uid,
          email,
          displayName: displayName || email.split("@")[0],
          photoURL: null,
          bio: "",
          followers: [],
          following: [],
          createdAt: serverTimestamp(),
        })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="fogees-card w-full max-w-md">
        <CardHeader className="space-y-1 pb-8 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-[13px] font-medium tracking-wide text-muted-foreground/80 uppercase">
            {isSignUp ? "Join our real-time community" : "Sign in to your dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div className="space-y-2">
                <Label
                  htmlFor="displayName"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="fogees-input h-11"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="fogees-input h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="fogees-input h-11"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/5 p-4 text-[13px] font-medium text-destructive border border-destructive/10">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-xl font-bold transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>

            <div className="pt-2 text-center text-[13px] font-medium text-muted-foreground">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError("")
                }}
                className="text-foreground transition-colors hover:text-primary underline decoration-primary/30 underline-offset-4"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Create one"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

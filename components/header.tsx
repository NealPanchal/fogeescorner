"use client"

import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function Header() {
  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-border/50 pb-8 pt-4">
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">Fogees</h1>
        <p className="mt-1 text-[13px] font-medium tracking-widest text-muted-foreground uppercase opacity-70">
          The Future of Social
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        className="rounded-full border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all bg-transparent"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </header>
  )
}

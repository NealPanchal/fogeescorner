"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Home, Search, User, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/firebase"
import { cn } from "@/lib/utils"

interface NavigationTabsProps {
  currentView: string
  onViewChange: (view: string) => void
  user: any
}

export function NavigationTabs({ currentView, onViewChange, user }: NavigationTabsProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    try {
      await auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const tabs = [
    {
      id: "feed",
      label: "Feed",
      icon: Home,
    },
    {
      id: "search",
      label: "Search",
      icon: Search,
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      onClick: () => router.push(`/profile/${user.uid}`),
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
  ]

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold">Fogees Corner</h1>
            <p className="text-xs text-muted-foreground">A Fogees social media platform</p>
          </div>
          <div className="flex items-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = currentView === tab.id
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    if (tab.onClick) {
                      tab.onClick()
                    } else {
                      onViewChange(tab.id)
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Button>
              )
            })}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </div>
  )
}

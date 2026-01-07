"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Home, Search, User, Settings, LogOut, X, Menu, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationCenter, NotificationButton } from "@/components/notification-center"
import { auth } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import { subscribeToNotifications } from "@/lib/notifications"

interface SidebarNavigationProps {
  currentView: string
  onViewChange: (view: string) => void
  user: any
  isMobileOpen: boolean
  onMobileClose: () => void
}

export function SidebarNavigation({ currentView, onViewChange, user, isMobileOpen, onMobileClose }: SidebarNavigationProps) {
  const router = useRouter()
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!auth.currentUser) return

    const unsubscribe = subscribeToNotifications(auth.currentUser.uid, (notifications) => {
      setUnreadCount(notifications.filter(n => !n.read).length)
    })

    return unsubscribe
  }, [])

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
      label: "My Profile",
      icon: User,
      onClick: () => router.push(`/profile/${user.uid}`),
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
  ]

  const handleTabClick = (tab: any) => {
    if (tab.onClick) {
      tab.onClick()
    } else {
      onViewChange(tab.id)
    }
    onMobileClose() // Close mobile menu after click
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-background border-r border-border z-50 transition-transform duration-300 ease-in-out",
        "w-64 lg:w-72",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl type-headline">Fogees Corner</h1>
                <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground type-eyebrow opacity-80">A Fogees social media platform</p>
              </div>
              <div className="flex items-center gap-2">
                <NotificationButton 
                  onClick={() => setIsNotificationOpen(true)} 
                  unreadCount={unreadCount}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onMobileClose}
                  className="lg:hidden flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 sm:p-4 space-y-2 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = currentView === tab.id
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-12",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleTabClick(tab)}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="type-link text-sm truncate">{tab.label}</span>
                </Button>
              )
            })}
          </nav>

          {/* User info and sign out */}
          <div className="p-3 sm:p-4 border-t border-border space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.displayName || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span className="type-link text-sm truncate">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
      />
    </>
  )
}

export function MobileMenuToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="lg:hidden"
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  )
}

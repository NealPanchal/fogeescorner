"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { auth } from "@/lib/firebase"
import { Bell, Heart, MessageCircle, TrendingUp, User, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Notification } from "@/types"

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen || !auth.currentUser) return

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc"),
      orderBy("read", "asc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = []
      snapshot.forEach((doc) => {
        notifs.push({
          id: doc.id,
          ...doc.data()
        } as Notification)
      })
      setNotifications(notifs)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [isOpen])

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read)
    await Promise.all(
      unreadNotifications.map(n => markAsRead(n.id))
    )
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'upvote':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'follow':
        return <User className="h-4 w-4 text-purple-500" />
      case 'spotlight':
        return <TrendingUp className="h-4 w-4 text-yellow-500" />
      case 'trending':
        return <TrendingUp className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return `${notification.actorName} liked your post`
      case 'comment':
        return `${notification.actorName} commented: "${notification.commentContent}"`
      case 'upvote':
        return `${notification.actorName} upvoted your post`
      case 'follow':
        return `${notification.actorName} started following you`
      case 'spotlight':
        return `Your post became community spotlight!`
      case 'trending':
        return `Your post is trending!`
      default:
        return 'New notification'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Mobile overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Notification panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Notifications</h2>
              {notifications.some(n => !n.read) && (
                <Badge variant="secondary" className="ml-2">
                  {notifications.filter(n => !n.read).length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifications.some(n => !n.read) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      p-4 hover:bg-muted/50 transition-colors cursor-pointer
                      ${!notification.read ? 'bg-primary/5' : ''}
                    `}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={notification.actorPhotoURL || undefined} alt={notification.actorName} />
                            <AvatarFallback className="text-xs">
                              {notification.actorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{notification.actorName}</span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {getNotificationText(notification)}
                        </p>
                        {notification.postContent && (
                          <p className="text-xs text-muted-foreground truncate bg-muted/30 rounded p-1 mb-1">
                            "{notification.postContent}"
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt?.toDate?.() || notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function NotificationButton({ onClick, unreadCount }: { onClick: () => void; unreadCount: number }) {
  return (
    <Button variant="ghost" size="icon" onClick={onClick} className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  )
}

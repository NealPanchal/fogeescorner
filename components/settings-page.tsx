"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { getUserSettings, updateUserSettings } from "@/lib/user-settings"
import { getUserTodayPostCount, DAILY_POST_LIMIT } from "@/lib/post-limits"
import type { UserSettings } from "@/types"

interface SettingsPageProps {
  user: any
  onBack: () => void
}

export function SettingsPage({ user, onBack }: SettingsPageProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [todayPostCount, setTodayPostCount] = useState(0)

  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.uid) {
        console.error("No user ID available")
        setLoading(false)
        return
      }

      try {
        const [userSettings, postCount] = await Promise.all([
          getUserSettings(user.uid),
          getUserTodayPostCount(user.uid)
        ])
        setSettings(userSettings)
        setTodayPostCount(postCount)
        console.log("Settings loaded:", userSettings)
      } catch (error) {
        console.error("Error loading settings:", error)
        // Set fallback default settings
        setSettings({
          id: user.uid,
          userId: user.uid,
          postingAndEngagement: {
            showDailyPostCounter: true,
            enableUpvotesOnMyPosts: true,
            enableCommentsOnMyPosts: true,
            confirmBeforePosting: false
          },
          privacy: {
            whoCanUpvoteMyPosts: 'everyone',
            whoCanComment: 'everyone'
          },
          notifications: {
            someoneUpvotedMyPost: true,
            myPostBecameCommunitySpotlight: true,
            myPostIsTrending: true
          },
          moderation: {
            hidePostsWithLowEngagement: false
          },
          updatedAt: new Date()
        })
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [user?.uid])

  const handleSettingChange = async (category: keyof UserSettings, key: string, value: any) => {
    if (!settings) return

    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    }

    setSettings(newSettings)

    try {
      setSaving(true)
      await updateUserSettings(user.uid, newSettings)
    } catch (error) {
      console.error("Error updating settings:", error)
      // Revert on error
      setSettings(settings)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Failed to load settings</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button variant="ghost" onClick={onBack}>
          Back to Feed
        </Button>
      </div>

      {/* Posting & Engagement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Posting & Engagement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="daily-counter">Daily Post Counter</Label>
              <p className="text-sm text-muted-foreground">
                Show your daily post limit ({todayPostCount}/{DAILY_POST_LIMIT})
              </p>
            </div>
            <Switch
              id="daily-counter"
              checked={settings.postingAndEngagement.showDailyPostCounter}
              onCheckedChange={(checked) => 
                handleSettingChange('postingAndEngagement', 'showDailyPostCounter', checked)
              }
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Current Daily Posts</Label>
              <p className="text-sm text-muted-foreground">
                Posts you've made today
              </p>
            </div>
            <Badge variant="secondary" className="font-mono">
              {todayPostCount}/{DAILY_POST_LIMIT}
            </Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="upvotes-enabled">Enable Upvotes on My Posts</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to upvote your posts
              </p>
            </div>
            <Switch
              id="upvotes-enabled"
              checked={settings.postingAndEngagement.enableUpvotesOnMyPosts}
              onCheckedChange={(checked) => 
                handleSettingChange('postingAndEngagement', 'enableUpvotesOnMyPosts', checked)
              }
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="comments-enabled">Enable Comments on My Posts</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to comment on your posts
              </p>
            </div>
            <Switch
              id="comments-enabled"
              checked={settings.postingAndEngagement.enableCommentsOnMyPosts}
              onCheckedChange={(checked) => 
                handleSettingChange('postingAndEngagement', 'enableCommentsOnMyPosts', checked)
              }
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="confirm-posting">Confirm Before Posting</Label>
              <p className="text-sm text-muted-foreground">
                Show confirmation dialog before posting
              </p>
            </div>
            <Switch
              id="confirm-posting"
              checked={settings.postingAndEngagement.confirmBeforePosting}
              onCheckedChange={(checked) => 
                handleSettingChange('postingAndEngagement', 'confirmBeforePosting', checked)
              }
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="who-can-upvote">Who Can Upvote My Posts</Label>
            <Select
              value={settings.privacy.whoCanUpvoteMyPosts}
              onValueChange={(value) => 
                handleSettingChange('privacy', 'whoCanUpvoteMyPosts', value)
              }
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="followers">Followers Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="who-can-comment">Who Can Comment</Label>
            <Select
              value={settings.privacy.whoCanComment}
              onValueChange={(value) => 
                handleSettingChange('privacy', 'whoCanComment', value)
              }
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="followers">Followers Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="upvote-notifications">Someone Upvoted My Post</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone upvotes your post
              </p>
            </div>
            <Switch
              id="upvote-notifications"
              checked={settings.notifications.someoneUpvotedMyPost}
              onCheckedChange={(checked) => 
                handleSettingChange('notifications', 'someoneUpvotedMyPost', checked)
              }
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="spotlight-notifications">My Post Became Community Spotlight</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your post becomes Community Spotlight
              </p>
            </div>
            <Switch
              id="spotlight-notifications"
              checked={settings.notifications.myPostBecameCommunitySpotlight}
              onCheckedChange={(checked) => 
                handleSettingChange('notifications', 'myPostBecameCommunitySpotlight', checked)
              }
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="trending-notifications">My Post is Trending</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your post appears in trending
              </p>
            </div>
            <Switch
              id="trending-notifications"
              checked={settings.notifications.myPostIsTrending}
              onCheckedChange={(checked) => 
                handleSettingChange('notifications', 'myPostIsTrending', checked)
              }
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Moderation & Safety */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Moderation & Safety</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="hide-low-engagement">Hide Posts With Low Engagement</Label>
              <p className="text-sm text-muted-foreground">
                Automatically hide posts with very few likes, comments, or upvotes
              </p>
            </div>
            <Switch
              id="hide-low-engagement"
              checked={settings.moderation.hidePostsWithLowEngagement}
              onCheckedChange={(checked) => 
                handleSettingChange('moderation', 'hidePostsWithLowEngagement', checked)
              }
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {saving && (
        <div className="text-center text-sm text-muted-foreground">
          Saving changes...
        </div>
      )}
    </div>
  )
}

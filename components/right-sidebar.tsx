'use client'

import { Search, TrendingUp, Hash, Users, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function RightSidebar() {
  const trendingTopics = [
    { tag: '#Web3', posts: '12.5K' },
    { tag: '#DeFi', posts: '8.2K' },
    { tag: '#NFTs', posts: '6.7K' },
    { tag: '#Crypto', posts: '15.3K' },
  ]

  const spotlightUsers = [
    { name: 'Alex Chen', handle: '@alexchen', followers: '125K' },
    { name: 'Sarah Miller', handle: '@sarahm', followers: '89K' },
    { name: 'David Kim', handle: '@davidk', followers: '67K' },
  ]

  return (
    <div className="hidden lg:block w-80 fixed right-0 top-0 h-full bg-card/50 border-l border-border/20 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-10 bg-background border-border/30 focus:border-primary focus:ring-primary/20"
          />
        </div>

        {/* Trending Topics */}
        <Card className="card-surface border-border/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">Trending</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {trendingTopics.map((topic, index) => (
              <div key={topic.tag} className="flex items-center justify-between py-2 hover:bg-secondary/50 rounded-lg px-2 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}</span>
                  <div>
                    <p className="font-medium text-foreground text-sm">{topic.tag}</p>
                    <p className="text-xs text-muted-foreground">{topic.posts} posts</p>
                  </div>
                </div>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Spotlight Users */}
        <Card className="card-surface border-border/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">Spotlight</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {spotlightUsers.map((user) => (
              <div key={user.handle} className="flex items-center justify-between py-2 hover:bg-secondary/50 rounded-lg px-2 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.handle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-foreground">{user.followers}</p>
                  <p className="text-xs text-muted-foreground">followers</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

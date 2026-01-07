// Deploy Firestore Indexes
// Run this to create required indexes for your queries

console.log(`
🔥 FIRESTORE INDEXES REQUIRED 🚨

The following indexes are needed for optimal performance:

1. Posts by userId + createdAt (for daily post count)
2. Posts by userId + createdAt + dailyIndex (for next daily index)  
3. Posts by createdAt (for trending posts)
4. Upvotes by postId + userId (for upvote operations)
5. Upvotes by postId + createdAt (for upvote subscriptions)
6. Comments by postId + userId (for comment operations)
7. Comments by postId + createdAt (for comment subscriptions)

📋 TO DEPLOY INDEXES:

Option 1: Automatic Deploy (Recommended)
  firebase deploy --only firestore:indexes

Option 2: Manual Create
  1. Go to: https://console.firebase.google.com/v1/r/project/fogeesmedia/firestore/indexes
  2. Click "Create Index"
  3. Use the composite index configuration from firestore.indexes.json

Option 3: Import Configuration
  1. Open Firebase Console → Firestore → Indexes
  2. Click "Import" 
  3. Upload firestore.indexes.json file

⚡ QUICK FIX (Temporary):
If you need immediate access, you can temporarily use less restrictive queries
by removing some where clauses, but this may impact performance.

📊 Index Configuration:
- Collection: posts
  - userId (ASC) + createdAt (ASC) + dailyIndex (DESC)
  - userId (ASC) + createdAt (ASC)
  - createdAt (DESC)

- Collection: upvotes  
  - postId (ASC) + userId (ASC)
  - postId (ASC) + createdAt (DESC)

- Collection: comments
  - postId (ASC) + userId (ASC) 
  - postId (ASC) + createdAt (DESC)

Deploy indexes now to resolve query errors! 🚀
`)

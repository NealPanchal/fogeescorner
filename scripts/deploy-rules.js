// Deploy Firestore Security Rules
// Run this in your terminal with: firebase deploy --only firestore:rules

const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Posts collection
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
      allow update: if request.auth != null && request.auth.uid == resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Upvotes collection
    match /upvotes/{upvoteId} {
      allow read: if true;
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.userId && 
        request.auth.uid != resource.data.postUserId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow update: if false;
    }
    
    // Comments collection
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow update: if false;
    }
    
    // User profiles
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User settings
    match /userSettings/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
      allow update: if request.auth != null && request.auth.uid == resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
`;

console.log('Copy the rules above to your Firebase Console > Firestore > Rules tab');
console.log('Or run: firebase deploy --only firestore:rules');

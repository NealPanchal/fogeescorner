// Test script for upvote functionality
// Run this in browser console when logged in

async function testUpvotes() {
  try {
    console.log('Testing upvote functionality...')
    
    // Test 1: Check if posts have required fields
    const postsQuery = query(collection(db, 'posts'), limit(1))
    const postsSnapshot = await getDocs(postsQuery)
    
    if (postsSnapshot.empty) {
      console.log('No posts found')
      return
    }
    
    const testPost = postsSnapshot.docs[0]
    const postData = testPost.data()
    
    console.log('Test post data:', {
      id: testPost.id,
      upvotesCount: postData.upvotesCount,
      upvotedBy: postData.upvotedBy,
      isSpotlight: postData.isSpotlight
    })
    
    // Test 2: Try to add an upvote
    const currentUserId = auth.currentUser?.uid
    if (!currentUserId) {
      console.log('No user logged in')
      return
    }
    
    console.log('Current user ID:', currentUserId)
    console.log('Post author ID:', postData.userId)
    console.log('Cannot upvote own post:', currentUserId === postData.userId)
    
    if (currentUserId !== postData.userId) {
      try {
        console.log('Attempting to add upvote...')
        await addUpvote(testPost.id, currentUserId)
        console.log('Upvote added successfully!')
        
        // Test 3: Try to remove the upvote
        console.log('Attempting to remove upvote...')
        await removeUpvote(testPost.id, currentUserId)
        console.log('Upvote removed successfully!')
        
      } catch (error) {
        console.error('Upvote test failed:', error)
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run the test
testUpvotes()

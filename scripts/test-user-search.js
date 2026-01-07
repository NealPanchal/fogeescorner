// Test User Search - Run this in browser console
console.log("🔍 Testing User Search Functionality");

// Check if users collection exists and has data
async function testUserSearch() {
  try {
    const { collection, getDocs } = await import('./lib/firebase.js');
    
    // Get all users to see what's in the database
    const usersRef = collection(window.db, "users");
    const snapshot = await getDocs(usersRef);
    
    console.log(`📊 Found ${snapshot.docs.length} users in database:`);
    
    snapshot.forEach((doc) => {
      const userData = doc.data();
      console.log(`👤 User: ${userData.displayName} (${doc.id})`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Bio: ${userData.bio || 'No bio'}`);
      console.log(`   Followers: ${userData.followers?.length || 0}`);
      console.log(`   Following: ${userData.following?.length || 0}`);
      console.log('---');
    });
    
    if (snapshot.docs.length === 0) {
      console.log("⚠️ No users found in database!");
      console.log("💡 Try creating some test users first");
    }
    
    return snapshot.docs.length;
  } catch (error) {
    console.error("❌ Error testing user search:", error);
    return 0;
  }
}

// Test search functionality
async function testSearchFunction() {
  try {
    const { collection, getDocs, query, where } = await import('./lib/firebase.js');
    
    // Test search with different queries
    const testQueries = ["", "a", "user", "test"];
    
    for (const query of testQueries) {
      console.log(`🔍 Testing search for: "${query}"`);
      
      const usersRef = collection(window.db, "users");
      const snapshot = await getDocs(usersRef);
      
      const results = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        if (doc.id !== window.auth?.currentUser?.uid) {
          const displayName = userData.displayName || "";
          const bio = userData.bio || "";
          
          const searchLower = query.toLowerCase();
          if (
            displayName.toLowerCase().includes(searchLower) ||
            bio.toLowerCase().includes(searchLower)
          ) {
            results.push({
              id: doc.id,
              displayName: displayName,
              photoURL: userData.photoURL || null,
              bio: bio,
              isFollowing: false // We'll test this separately
            });
          }
        }
      });
      
      console.log(`📋 Found ${results.length} results for "${query}":`);
      results.forEach(user => {
        console.log(`   - ${user.displayName} (${user.bio ? user.bio.substring(0, 50) + '...' : 'No bio'})`);
      });
      console.log('---');
    }
  } catch (error) {
    console.error("❌ Error testing search function:", error);
  }
}

// Create test users if database is empty
async function createTestUsers() {
  try {
    const { collection, doc, setDoc } = await import('./lib/firebase.js');
    
    const testUsers = [
      {
        id: "user1",
        email: "user1@example.com",
        displayName: "Alice Johnson",
        photoURL: null,
        bio: "Frontend developer who loves React and TypeScript",
        followers: [],
        following: [],
        createdAt: new Date()
      },
      {
        id: "user2", 
        email: "user2@example.com",
        displayName: "Bob Smith",
        photoURL: null,
        bio: "Backend engineer working with Node.js and Firebase",
        followers: [],
        following: [],
        createdAt: new Date()
      },
      {
        id: "user3",
        email: "user3@example.com", 
        displayName: "Charlie Brown",
        photoURL: null,
        bio: "Full-stack developer passionate about web development",
        followers: [],
        following: [],
        createdAt: new Date()
      }
    ];
    
    console.log("👥 Creating test users...");
    
    for (const user of testUsers) {
      await setDoc(doc(window.db, "users", user.id), user);
      console.log(`✅ Created user: ${user.displayName}`);
    }
    
    console.log("🎉 Test users created successfully!");
  } catch (error) {
    console.error("❌ Error creating test users:", error);
  }
}

// Main test function
async function runTests() {
  console.log("🚀 Starting User Search Tests");
  
  const userCount = await testUserSearch();
  
  if (userCount === 0) {
    console.log("📝️ No users found. Creating test users...");
    await createTestUsers();
    console.log("⏳ Waiting 2 seconds for database to update...");
    setTimeout(async () => {
      await testUserSearch();
      await testSearchFunction();
    }, 2000);
  } else {
    await testSearchFunction();
  }
  
  console.log("✅ User search tests completed!");
  console.log("💡 Try searching for 'Alice', 'Bob', or 'Charlie' in the search bar");
}

// Make functions available globally
window.testUserSearch = testUserSearch;
window.testSearchFunction = testSearchFunction;
window.createTestUsers = createTestUsers;
window.runUserTests = runTests;

console.log("🔧 User search test functions loaded!");
console.log("💡 Run window.runUserTests() to test user search functionality");

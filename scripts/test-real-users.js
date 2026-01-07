// Test Real Users - Run this in browser console
console.log("🔍 Testing Real User Database");

async function checkDatabaseUsers() {
  try {
    const { collection, getDocs } = await import('./lib/firebase.js');
    
    if (!window.db) {
      console.error("❌ Firebase not initialized. Make sure you're on the app page and logged in.");
      return;
    }
    
    console.log("📊 Checking users collection...");
    
    const usersRef = collection(window.db, "users");
    const snapshot = await getDocs(usersRef);
    
    console.log(`📊 Found ${snapshot.docs.length} users in database:`);
    
    if (snapshot.docs.length === 0) {
      console.log("⚠️ No users found in database!");
      console.log("💡 This means:");
      console.log("   1. No one has signed up yet, OR");
      console.log("   2. Users are not being created properly during signup");
      console.log("🔧 Try signing up with a new account to test user creation");
      return;
    }
    
    snapshot.forEach((doc) => {
      const userData = doc.data();
      console.log(`👤 User: ${userData.displayName} (${doc.id})`);
      console.log(`   📧 Email: ${userData.email}`);
      console.log(`   📝 Bio: ${userData.bio || 'No bio'}`);
      console.log(`   👥 Followers: ${userData.followers?.length || 0}`);
      console.log(`   👤 Following: ${userData.following?.length || 0}`);
      console.log(`   📷 Photo: ${userData.photoURL ? 'Yes' : 'No'}`);
      console.log(`   📅 Created: ${userData.createdAt?.toDate?.() || 'Unknown'}`);
      console.log('---');
    });
    
    return snapshot.docs;
  } catch (error) {
    console.error("❌ Error checking database users:", error);
    return [];
  }
}

async function testUserCreation() {
  try {
    console.log("👥 Testing user creation process...");
    
    // Check if current user exists
    if (!window.auth?.currentUser) {
      console.log("⚠️ No current user. Please sign up first.");
      return;
    }
    
    const currentUser = window.auth.currentUser;
    console.log(`👤 Current user: ${currentUser.displayName} (${currentUser.uid})`);
    
    // Check if user document exists in Firestore
    const { doc, getDoc } = await import('./lib/firebase.js');
    const userDoc = await getDoc(doc(window.db, "users", currentUser.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log("✅ User document exists in Firestore:");
      console.log(`   📧 Email: ${userData.email}`);
      console.log(`   👤 Name: ${userData.displayName}`);
      console.log(`   👥 Followers: ${userData.followers?.length || 0}`);
      console.log(`   👤 Following: ${userData.following?.length || 0}`);
      console.log("🎉 User creation is working correctly!");
    } else {
      console.log("❌ User document NOT found in Firestore!");
      console.log("🔧 This means user creation during signup failed");
    }
    
  } catch (error) {
    console.error("❌ Error testing user creation:", error);
  }
}

async function simulateSearch() {
  try {
    console.log("🔍 Simulating user search...");
    
    const users = await checkDatabaseUsers();
    
    if (users.length === 0) {
      console.log("⚠️ Cannot test search - no users in database");
      return;
    }
    
    // Test different search queries
    const testQueries = ["", "a", "e", "user", "test"];
    
    for (const query of testQueries) {
      console.log(`🔍 Testing search: "${query}"`);
      
      const results = users.filter(user => {
        if (user.id === window.auth?.currentUser?.uid) return false; // Exclude current user
        
        const displayName = user.displayName || "";
        const bio = user.bio || "";
        const searchLower = query.toLowerCase();
        
        return displayName.toLowerCase().includes(searchLower) || 
               bio.toLowerCase().includes(searchLower);
      });
      
      console.log(`   📋 Found ${results.length} results:`);
      results.forEach(user => {
        console.log(`      - ${user.displayName} (${user.bio ? user.bio.substring(0, 30) + '...' : 'No bio'})`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error("❌ Error simulating search:", error);
  }
}

// Main test function
async function runRealUserTests() {
  console.log("🚀 Starting Real User Tests");
  console.log("=" .repeat(50));
  
  // Test 1: Check database users
  await checkDatabaseUsers();
  
  // Test 2: Test current user creation
  await testUserCreation();
  
  // Test 3: Test search functionality
  await simulateSearch();
  
  console.log("=" .repeat(50));
  console.log("✅ Real user tests completed!");
  console.log("💡 If no users found, sign up for a new account to test user creation");
}

// Make functions available globally
window.checkDatabaseUsers = checkDatabaseUsers;
window.testUserCreation = testUserCreation;
window.simulateSearch = simulateSearch;
window.runRealUserTests = runRealUserTests;

console.log("🔧 Real user test functions loaded!");
console.log("💡 Run window.runRealUserTests() to test the complete user system");

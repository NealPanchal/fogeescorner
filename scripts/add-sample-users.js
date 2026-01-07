// Add Sample Users - Run this in browser console
console.log("👥 Adding Sample Users for Testing");

async function addSampleUsers() {
  try {
    // Check if Firebase is available
    if (!window.db || !window.auth) {
      console.error("❌ Firebase not initialized. Make sure you're on the app page.");
      return;
    }

    const { collection, doc, setDoc } = await import('./lib/firebase.js');
    
    const sampleUsers = [
      {
        displayName: "Alex Thompson",
        email: "alex@example.com",
        photoURL: null,
        bio: "UI/UX designer passionate about creating beautiful user experiences",
        followers: [],
        following: [],
        createdAt: new Date()
      },
      {
        displayName: "Sarah Chen",
        email: "sarah@example.com", 
        photoURL: null,
        bio: "Full-stack developer who loves building scalable web applications",
        followers: [],
        following: [],
        createdAt: new Date()
      },
      {
        displayName: "Mike Johnson",
        email: "mike@example.com",
        photoURL: null,
        bio: "Mobile app developer focused on React Native",
        followers: [],
        following: [],
        createdAt: new Date()
      },
      {
        displayName: "Emma Davis",
        email: "emma@example.com",
        photoURL: null,
        bio: "Data scientist exploring machine learning and AI",
        followers: [],
        following: [],
        createdAt: new Date()
      },
      {
        displayName: "David Wilson",
        email: "david@example.com",
        photoURL: null,
        bio: "DevOps engineer automating everything possible",
        followers: [],
        following: [],
        createdAt: new Date()
      }
    ];

    console.log(`📝️ Adding ${sampleUsers.length} sample users...`);
    
    let addedCount = 0;
    for (const user of sampleUsers) {
      try {
        // Generate unique ID for each user
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await setDoc(doc(window.db, "users", userId), {
          ...user,
          id: userId,
          createdAt: new Date()
        });
        
        console.log(`✅ Added user: ${user.displayName}`);
        addedCount++;
      } catch (error) {
        console.error(`❌ Failed to add ${user.displayName}:`, error);
      }
    }
    
    console.log(`🎉 Successfully added ${addedCount} users to database!`);
    console.log("💡 Now you can search for: Alex, Sarah, Mike, Emma, or David");
    
    // Test search immediately
    setTimeout(() => {
      console.log("🔍 Testing search functionality...");
      testSearchWithSampleData();
    }, 1000);
    
  } catch (error) {
    console.error("❌ Error adding sample users:", error);
  }
}

async function testSearchWithSampleData() {
  try {
    const { collection, getDocs } = await import('./lib/firebase.js');
    
    const usersRef = collection(window.db, "users");
    const snapshot = await getDocs(usersRef);
    
    const users = [];
    snapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        displayName: userData.displayName,
        bio: userData.bio,
        followers: userData.followers?.length || 0,
        following: userData.following?.length || 0
      });
    });
    
    console.log(`📊 Database now has ${users.length} users:`);
    users.forEach(user => {
      console.log(`   👤 ${user.displayName} (${user.followers} followers, ${user.following} following)`);
    });
    
    // Test search queries
    const testQueries = ["Alex", "Sarah", "developer", "UI"];
    
    for (const query of testQueries) {
      const results = users.filter(user => 
        user.displayName.toLowerCase().includes(query.toLowerCase()) ||
        (user.bio && user.bio.toLowerCase().includes(query.toLowerCase()))
      );
      
      console.log(`🔍 Search "${query}" found ${results.length} results:`);
      results.forEach(user => {
        console.log(`   - ${user.displayName}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error testing search:", error);
  }
}

// Make functions available globally
window.addSampleUsers = addSampleUsers;
window.testSearchWithSampleData = testSearchWithSampleData;

console.log("🔧 Sample users script loaded!");
console.log("💡 Run window.addSampleUsers() to add test users");
console.log("🔍 After adding users, try searching in the app");

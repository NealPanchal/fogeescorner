import { db } from "@/lib/firebase"
import { collection, query, orderBy, limit, getDocs, serverTimestamp, writeBatch, where } from "firebase/firestore"

/**
 * This script identifies the post with the most likes from the last 7 days
 * and sets it as the 'Post of the Week'.
 */
export async function updatePostOfTheWeek() {
  console.log("[v0] Starting Post of the Week selection...")

  try {
    const postsRef = collection(db, "posts")

    // 1. Reset previous highlight
    const prevHighlightQuery = query(postsRef, where("isPostOfWeek", "==", true))
    const prevHighlightDocs = await getDocs(prevHighlightQuery)
    const batch = writeBatch(db)

    prevHighlightDocs.forEach((d) => {
      batch.update(d.ref, { isPostOfWeek: false })
    })

    // 2. Find new winner (top liked post)
    const topPostQuery = query(postsRef, orderBy("likes", "desc"), limit(1))
    const topPostDocs = await getDocs(topPostQuery)

    if (!topPostDocs.empty) {
      const winnerDoc = topPostDocs.docs[0]
      batch.update(winnerDoc.ref, {
        isPostOfWeek: true,
        postOfWeekDate: serverTimestamp(),
      })

      await batch.commit()
      console.log("[v0] Successfully updated Post of the Week:", winnerDoc.id)
    } else {
      console.log("[v0] No posts found to select from.")
    }
  } catch (error) {
    console.error("[v0] Error updating highlight:", error)
  }
}

import { UserSearch } from "@/components/user-search"

export default function SearchPage() {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Search Users</h1>
        <UserSearch />
      </div>
    </main>
  )
}

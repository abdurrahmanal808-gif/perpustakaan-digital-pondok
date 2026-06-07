import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";
import type {
  Book,
  BookFile,
  BookType,
  BookWithRelations,
  Category,
  DashboardStats,
  PublicUser
} from "@/lib/db/types";

export type BookSearchParams = {
  search?: string;
  category?: string;
  type?: BookType | "";
  sort?: "newest" | "popular" | "downloads";
  limit?: number;
};

function cleanSearchTerm(value?: string) {
  return value?.trim().replace(/[,%()]/g, " ").replace(/\s+/g, " ").slice(0, 80);
}

export async function getActiveCategories() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as Category[];
}

export async function getAllCategories() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as Category[];
}

export async function getPublicBooks(params: BookSearchParams = {}) {
  const supabase = getSupabaseAdminClient();
  const search = cleanSearchTerm(params.search);
  let query = supabase
    .from("books")
    .select(
      "*,categories(id,name,slug),users(id,username,full_name),book_files(*)"
    )
    .eq("status", "published");

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,author.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  if (params.category) {
    query = query.eq("category_id", params.category);
  }

  if (params.type) {
    query = query.eq("book_type", params.type);
  }

  if (params.sort === "popular") {
    query = query.order("view_count", { ascending: false });
  } else if (params.sort === "downloads") {
    query = query.order("download_count", { ascending: false });
  } else {
    query = query.order("published_at", { ascending: false, nullsFirst: false });
  }

  query = query.limit(params.limit || 60);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as BookWithRelations[];
}

export async function getBookDetail(bookId: string, user?: PublicUser | null) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("books")
    .select(
      "*,categories(id,name,slug),users(id,username,full_name),book_files(*)"
    )
    .eq("id", bookId)
    .neq("status", "deleted")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const book = data as BookWithRelations;
  const canAccess =
    book.status === "published" ||
    user?.role === "admin" ||
    (user && book.user_id === user.id);

  if (!canAccess) {
    return null;
  }

  book.book_files = (book.book_files || []).sort((a, b) => {
    return (a.page_number || 0) - (b.page_number || 0);
  });

  return book;
}

export async function getMyBooks(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("books")
    .select("*,categories(id,name,slug),book_files(*)")
    .eq("user_id", userId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as BookWithRelations[];
}

export async function getBookForEdit(bookId: string, user: PublicUser) {
  const book = await getBookDetail(bookId, user);

  if (!book) {
    return null;
  }

  if (book.user_id !== user.id && user.role !== "admin") {
    return null;
  }

  return book;
}

export async function getBookFiles(bookId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("book_files")
    .select("*")
    .eq("book_id", bookId)
    .order("page_number", { ascending: true, nullsFirst: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as BookFile[];
}

export async function getUserDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = getSupabaseAdminClient();
  const [books, favorites, shelves, history] = await Promise.all([
    supabase
      .from("books")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "deleted"),
    supabase
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("shelves")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("reading_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
  ]);

  return {
    totalBooks: books.count || 0,
    totalFavorites: favorites.count || 0,
    totalShelves: shelves.count || 0,
    totalHistory: history.count || 0
  };
}

export async function getFeaturedBooks(limit = 6) {
  return getPublicBooks({ limit, sort: "newest" });
}

export async function findBookOwner(bookId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("books")
    .select("id,user_id,status,cover_path,title")
    .eq("id", bookId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Pick<Book, "id" | "user_id" | "status" | "cover_path" | "title">;
}

export type UserRole = "user" | "admin";
export type BookType = "pdf" | "scan";
export type BookStatus = "pending" | "published" | "hidden" | "deleted";
export type FileKind = "pdf" | "page" | "cover";

export type AppUser = {
  id: string;
  username: string;
  full_name: string | null;
  password_hash: string;
  role: UserRole;
  is_blocked: boolean;
  blocked_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicUser = Omit<AppUser, "password_hash">;

export type SessionRecord = {
  id: string;
  user_id: string;
  token_hash: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Book = {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  author: string | null;
  description: string | null;
  book_type: BookType;
  status: BookStatus;
  cover_path: string;
  rights_confirmed: boolean;
  view_count: number;
  download_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BookFile = {
  id: string;
  book_id: string;
  storage_bucket: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  file_kind: FileKind;
  page_number: number | null;
  created_at: string;
  updated_at: string;
};

export type BookWithRelations = Book & {
  categories: Pick<Category, "id" | "name" | "slug"> | null;
  users: Pick<PublicUser, "id" | "username" | "full_name"> | null;
  book_files?: BookFile[];
};

export type Favorite = {
  id: string;
  user_id: string;
  book_id: string;
  created_at: string;
};

export type Shelf = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ReadingHistory = {
  id: string;
  user_id: string;
  book_id: string;
  last_page: number | null;
  progress_percent: number;
  last_read_at: string;
  created_at: string;
  updated_at: string;
};

export type DashboardStats = {
  totalBooks: number;
  totalFavorites: number;
  totalShelves: number;
  totalHistory: number;
};

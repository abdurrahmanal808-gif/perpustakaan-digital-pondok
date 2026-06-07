export type AuthInput = {
  username: string;
  password: string;
  fullName?: string;
};

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string) {
  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return "Username harus 3-30 karakter dan hanya boleh huruf kecil, angka, atau underscore.";
  }

  return null;
}

export function validatePassword(password: string) {
  if (password.length < 8) {
    return "Password minimal 8 karakter.";
  }

  if (password.length > 128) {
    return "Password maksimal 128 karakter.";
  }

  return null;
}

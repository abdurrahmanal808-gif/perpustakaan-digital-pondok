import "server-only";

import { createHash, createHmac } from "crypto";
import type { StorageProvider } from "@/lib/db/types";
import { sanitizeFileName } from "@/lib/security/filename";

const R2_REGION = "auto";
const R2_SERVICE = "s3";
const SIGNING_ALGORITHM = "AWS4-HMAC-SHA256";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
};

type SignedRequestOptions = {
  method: "PUT" | "DELETE";
  key: string;
  body?: Buffer;
  contentType?: string;
};

type SignedUrlOptions = {
  key: string;
  expiresIn: number;
  fileName?: string;
  inline?: boolean;
};

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName
  };
}

export function isR2Configured() {
  return Boolean(getR2Config());
}

export function getUploadStorageProvider(): StorageProvider {
  const configured = process.env.UPLOAD_STORAGE_PROVIDER;

  if (configured === "supabase") {
    return "supabase";
  }

  if (configured === "r2") {
    if (!isR2Configured()) {
      throw new Error("UPLOAD_STORAGE_PROVIDER=r2, tapi env R2 belum lengkap.");
    }

    return "r2";
  }

  return isR2Configured() ? "r2" : "supabase";
}

export function getStorageBucketForProvider(
  provider: StorageProvider,
  supabaseBucket: string
) {
  if (provider === "r2") {
    const config = getR2Config();

    if (!config) {
      throw new Error("Credential Cloudflare R2 belum lengkap.");
    }

    return config.bucketName;
  }

  return supabaseBucket;
}

function encodePath(value: string) {
  return value
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function encodeQuery(value: string) {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function amzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function dateStamp(date: Date) {
  return amzDate(date).slice(0, 8);
}

function sha256Hex(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function hmacHex(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function signingKey(secretAccessKey: string, stamp: string) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, stamp);
  const regionKey = hmac(dateKey, R2_REGION);
  const serviceKey = hmac(regionKey, R2_SERVICE);

  return hmac(serviceKey, "aws4_request");
}

function credentialScope(stamp: string) {
  return `${stamp}/${R2_REGION}/${R2_SERVICE}/aws4_request`;
}

function canonicalQuery(params: Record<string, string>) {
  return Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeQuery(key)}=${encodeQuery(value)}`)
    .join("&");
}

function r2Url(config: R2Config, key: string) {
  const url = new URL(
    `https://${config.accountId}.r2.cloudflarestorage.com/${encodeURIComponent(
      config.bucketName
    )}/${encodePath(key)}`
  );

  return url;
}

function signRequest({ method, key, body, contentType }: SignedRequestOptions) {
  const config = getR2Config();

  if (!config) {
    throw new Error("Credential Cloudflare R2 belum lengkap.");
  }

  const now = new Date();
  const requestDate = amzDate(now);
  const stamp = dateStamp(now);
  const scope = credentialScope(stamp);
  const url = r2Url(config, key);
  const payloadHash = sha256Hex(body || "");
  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": requestDate
  };

  if (contentType) {
    headers["content-type"] = contentType;
  }

  const sortedHeaders = Object.entries(headers).sort(([left], [right]) =>
    left.localeCompare(right)
  );
  const canonicalHeaders = sortedHeaders
    .map(([name, value]) => `${name}:${value.trim().replace(/\s+/g, " ")}`)
    .join("\n");
  const signedHeaders = sortedHeaders.map(([name]) => name).join(";");
  const canonicalRequest = [
    method,
    url.pathname,
    "",
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash
  ].join("\n");
  const stringToSign = [
    SIGNING_ALGORITHM,
    requestDate,
    scope,
    sha256Hex(canonicalRequest)
  ].join("\n");
  const signature = hmacHex(signingKey(config.secretAccessKey, stamp), stringToSign);
  const authorization = `${SIGNING_ALGORITHM} Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    url,
    headers: {
      ...headers,
      authorization
    }
  };
}

function createPresignedGetUrl({ key, expiresIn, fileName, inline }: SignedUrlOptions) {
  const config = getR2Config();

  if (!config) {
    throw new Error("Credential Cloudflare R2 belum lengkap.");
  }

  const now = new Date();
  const requestDate = amzDate(now);
  const stamp = dateStamp(now);
  const scope = credentialScope(stamp);
  const url = r2Url(config, key);
  const safeExpires = Math.min(Math.max(expiresIn, 1), 60 * 60 * 24 * 7);
  const query: Record<string, string> = {
    "X-Amz-Algorithm": SIGNING_ALGORITHM,
    "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD",
    "X-Amz-Credential": `${config.accessKeyId}/${scope}`,
    "X-Amz-Date": requestDate,
    "X-Amz-Expires": String(safeExpires),
    "X-Amz-SignedHeaders": "host"
  };

  if (fileName) {
    const disposition = inline ? "inline" : "attachment";
    query["response-content-disposition"] =
      `${disposition}; filename="${sanitizeFileName(fileName)}"`;
  } else if (inline) {
    query["response-content-disposition"] = "inline";
  }

  const canonicalRequest = [
    "GET",
    url.pathname,
    canonicalQuery(query),
    `host:${url.host}\n`,
    "host",
    "UNSIGNED-PAYLOAD"
  ].join("\n");
  const stringToSign = [
    SIGNING_ALGORITHM,
    requestDate,
    scope,
    sha256Hex(canonicalRequest)
  ].join("\n");
  const signature = hmacHex(signingKey(config.secretAccessKey, stamp), stringToSign);

  query["X-Amz-Signature"] = signature;
  url.search = canonicalQuery(query);

  return url.toString();
}

export async function uploadFileToR2(file: File, key: string) {
  const body = Buffer.from(await file.arrayBuffer());
  const { url, headers } = signRequest({
    method: "PUT",
    key,
    body,
    contentType: file.type || "application/octet-stream"
  });
  const response = await fetch(url, {
    method: "PUT",
    body,
    headers
  });

  if (!response.ok) {
    throw new Error(`Upload file ke R2 gagal: ${response.status} ${response.statusText}`);
  }
}

export async function deleteFileFromR2(key: string) {
  const { url, headers } = signRequest({
    method: "DELETE",
    key,
    body: Buffer.alloc(0)
  });
  const response = await fetch(url, {
    method: "DELETE",
    headers
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Hapus file R2 gagal: ${response.status} ${response.statusText}`);
  }
}

export function createR2SignedReadUrl(key: string, expiresIn = 60 * 10) {
  return createPresignedGetUrl({
    key,
    expiresIn,
    inline: true
  });
}

export function createR2SignedDownloadUrl(
  key: string,
  fileName: string,
  expiresIn = 60 * 5
) {
  return createPresignedGetUrl({
    key,
    expiresIn,
    fileName,
    inline: false
  });
}

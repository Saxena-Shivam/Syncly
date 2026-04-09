const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type RequestOptions = {
  method?: string;
  token?: string;
  body?: unknown;
};

const request = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed: ${response.status}`);
  }

  return payload as T;
};

export type ApiUser = {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  online?: boolean;
  lastSeenAt?: string | null;
  createdAt?: string;
  lastMessage?: string;
  lastMessageType?: "text" | "image" | "video" | "document";
  lastMessageFileUrl?: string;
  lastMessageAt?: string;
};

export type ApiMessage = {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  fileUrl?: string;
  type: "text" | "image" | "video" | "document";
  delivered: boolean;
  seen: boolean;
  createdAt: string;
};

export const registerWithEmail = async (
  email: string,
  password: string,
  username: string,
) => {
  return request<{ token: string; user: ApiUser }>("/auth/register", {
    method: "POST",
    body: {
      email,
      password,
      username,
    },
  });
};

export const loginWithEmail = async (email: string, password: string) => {
  return request<{ token: string; user: ApiUser }>("/auth/login", {
    method: "POST",
    body: {
      email,
      password,
    },
  });
};

export const loginWithGoogle = async (idToken: string) => {
  return request<{ token: string; user: ApiUser }>("/auth/google", {
    method: "POST",
    body: {
      idToken,
    },
  });
};

export const getCurrentUser = async (token: string) => {
  return request<{ user: ApiUser }>("/user/me", { token });
};

export const getUsers = async (token: string, search = "") => {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return request<{ users: ApiUser[] }>(`/users${query}`, { token });
};

export const getMessages = async (token: string, userId: string) => {
  return request<{ messages: ApiMessage[] }>(`/messages/${userId}`, { token });
};

export const getConversations = async (token: string) => {
  return request<{ users: ApiUser[] }>("/messages/conversations", { token });
};

export const uploadChatFile = async (token: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed: ${response.status}`);
  }

  return payload as {
    fileUrl: string;
    type: "image" | "video" | "document";
    originalName: string;
    size: number;
  };
};

export const generateQrToken = async (token: string) => {
  return request<{ token: string; expiresAt: number }>("/generate-qr", {
    token,
  });
};

export const connectViaQrToken = async (token: string, qrToken: string) => {
  return request<{
    success: true;
    ownerUserId: string;
    connectedUserId: string;
  }>("/connect-device", {
    method: "POST",
    token,
    body: { token: qrToken },
  });
};

export { API_BASE };

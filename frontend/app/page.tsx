"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import {
  ArrowRight,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import ChatLayout from "@/components/chat/ChatLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ApiMessage,
  ApiUser,
  connectViaQrToken,
  getConversations,
  getCurrentUser,
  getMessages,
  getUsers,
  loginWithEmail,
  registerWithEmail,
  uploadChatFile,
} from "@/lib/api";
import { ChatMessage, ChatRoom } from "@/types/chat";
import {
  closeSocket,
  emitMessage,
  emitStopTyping,
  emitTyping,
  initSocket,
  onDeviceConnected,
  onMessageSent,
  onReceiveMessage,
  onStopTypingIndicator,
  onTypingIndicator,
  onUserOnlineStatus,
} from "@/lib/socket";

type Screen = "landing" | "auth" | "chat";
type AuthMode = "login" | "register";

const TOKEN_KEY = "syncly_token";

const featureCards = [
  {
    icon: Zap,
    title: "Instant Conversations",
    description: "Messages appear quickly so every chat feels natural.",
  },
  {
    icon: Wifi,
    title: "Works Everywhere",
    description: "Open Syncly on your phone or desktop and keep going.",
  },
  {
    icon: ShieldCheck,
    title: "Private Sign In",
    description:
      "Sign in with email and password using a simple, familiar flow.",
  },
  {
    icon: Upload,
    title: "Share Photos & Files",
    description: "Send pictures and documents right inside the conversation.",
  },

  {
    icon: Sparkles,
    title: "Feels Fast",
    description:
      "Everything responds right away, so chatting feels effortless.",
  },

  {
    icon: Users,
    title: "Easy to Use",
    description: "Clean layout that feels simple from the first tap.",
  },
];

const landingPoints = [
  "See who is online and return to old chats instantly",
  "Share files, pair devices, and stay connected",
];

const fallbackAvatar = (name: string) =>
  `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(name || "syncly")}`;

export default function Home() {
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);

  const [screen, setScreen] = useState<Screen>("landing");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [token, setToken] = useState("");
  const [me, setMe] = useState<ApiUser | null>(null);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [searchResults, setSearchResults] = useState<ApiUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [activeUserId, setActiveUserId] = useState("");
  const [unreadByUser, setUnreadByUser] = useState<Record<string, number>>({});
  const [messagesByUser, setMessagesByUser] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [isTyping, setIsTyping] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const socketBoundRef = useRef(false);
  const userLookupRef = useRef<Record<string, ApiUser>>({});
  const activeUserIdRef = useRef("");
  const bootstrappedTokenRef = useRef<string | null>(null);
  const handledPairTokenRef = useRef<string | null>(null);

  const userLookup = useMemo(() => {
    const map: Record<string, ApiUser> = {};
    for (const user of users) {
      map[user.id] = user;
    }
    for (const user of searchResults) {
      map[user.id] = user;
    }
    if (me?.id) {
      map[me.id] = me;
    }
    return map;
  }, [me, searchResults, users]);

  useEffect(() => {
    userLookupRef.current = userLookup;
  }, [userLookup]);

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
  }, [activeUserId]);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  const themeToggleIcon =
    themeMounted && resolvedTheme === "dark" ? (
      <Sun className="h-4 w-4" />
    ) : (
      <Moon className="h-4 w-4" />
    );

  const roomList = useMemo<ChatRoom[]>(() => {
    const rooms = users.map((user) => {
      const isSelfRoom = user.id === me?.id;
      const roomMessages = messagesByUser[user.id] || [];
      const last = roomMessages[roomMessages.length - 1];

      return {
        id: user.id,
        name: isSelfRoom ? `${user.username} (You)` : user.username,
        unreadCount: unreadByUser[user.id] || 0,
        lastMessage:
          last?.content ||
          user.lastMessage ||
          (isSelfRoom
            ? "Saved notes and files"
            : user.online
              ? "Online now"
              : "No messages yet"),
        timestamp:
          last?.timestamp ||
          new Date(user.lastMessageAt || user.createdAt || Date.now()),
        avatar: user.avatar || fallbackAvatar(user.username),
        subtitle: isSelfRoom
          ? "Saved messages"
          : user.online
            ? "Online"
            : "Offline",
      };
    });

    return rooms.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [me?.id, unreadByUser, users, messagesByUser]);

  const activeMessages = messagesByUser[activeUserId] || [];

  useEffect(() => {
    if (screen !== "chat") {
      return;
    }

    const searchableRoomIds = new Set(searchResults.map((item) => item.id));

    if (!roomList.length && !searchableRoomIds.size) {
      if (activeUserId) {
        setActiveUserId("");
      }
      return;
    }

    const hasActiveRoom =
      roomList.some((room) => room.id === activeUserId) ||
      searchableRoomIds.has(activeUserId);

    if (!hasActiveRoom) {
      setActiveUserId(roomList[0]?.id || "");
    }
  }, [activeUserId, roomList, screen, searchResults]);

  const mapApiMessage = useCallback(
    (message: ApiMessage): ChatMessage => {
      const own = message.senderId === me?.id;
      const senderUser = userLookup[message.senderId];
      const receiverUser = userLookup[message.receiverId];

      return {
        id: message._id,
        sender: own ? me?.username || "You" : senderUser?.username || "User",
        content: message.text || "",
        timestamp: new Date(message.createdAt),
        isOwn: own,
        type: message.type,
        fileUrl: message.fileUrl,
        delivered: message.delivered,
        seen: message.seen,
        avatar: own
          ? me?.avatar || fallbackAvatar(me?.username || "you")
          : senderUser?.avatar ||
            receiverUser?.avatar ||
            fallbackAvatar(senderUser?.username || "user"),
      };
    },
    [me, userLookup],
  );

  const loadMessagesForUser = useCallback(
    async (sessionToken: string, targetUserId: string) => {
      const { messages } = await getMessages(sessionToken, targetUserId);
      setMessagesByUser((prev) => ({
        ...prev,
        [targetUserId]: messages.map(mapApiMessage),
      }));
    },
    [mapApiMessage],
  );

  const bootstrapSession = useCallback(
    async (sessionToken: string) => {
      setIsBootstrapping(true);
      setErrorText("");

      try {
        const [{ user }, { users: conversationUsers }] = await Promise.all([
          getCurrentUser(sessionToken),
          getConversations(sessionToken),
        ]);

        const firstRoomId = conversationUsers[0]?.id || "";

        setToken(sessionToken);
        setMe(user);
        setUsers(conversationUsers);
        setSearchResults([]);
        setScreen("chat");
        setActiveUserId(firstRoomId);
        setUnreadByUser({});

        if (typeof window !== "undefined") {
          localStorage.setItem(TOKEN_KEY, sessionToken);
        }

        if (firstRoomId) {
          await loadMessagesForUser(sessionToken, firstRoomId);
        }
      } catch (error) {
        setErrorText(
          error instanceof Error ? error.message : "Failed to load session",
        );
        setScreen("auth");
        setToken("");
        setMe(null);
        setUsers([]);
        setSearchResults([]);
        setActiveUserId("");
        setUnreadByUser({});
        if (typeof window !== "undefined") {
          localStorage.removeItem(TOKEN_KEY);
        }
      } finally {
        setIsBootstrapping(false);
      }
    },
    [loadMessagesForUser],
  );

  const logout = useCallback(() => {
    closeSocket();
    socketBoundRef.current = false;
    setScreen("landing");
    setToken("");
    setMe(null);
    setUsers([]);
    setSearchResults([]);
    setActiveUserId("");
    setUnreadByUser({});
    setMessagesByUser({});
    setErrorText("");
    setEmail("");
    setPassword("");
    setUsername("");

    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  const handleSubmitAuth = useCallback(async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedUsername = username.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setErrorText("Email and password are required.");
      return;
    }

    if (authMode === "register" && !trimmedUsername) {
      setErrorText("Choose a username for your profile.");
      return;
    }

    setIsSubmitting(true);
    setErrorText("");

    try {
      const response =
        authMode === "register"
          ? await registerWithEmail(
              trimmedEmail,
              trimmedPassword,
              trimmedUsername,
            )
          : await loginWithEmail(trimmedEmail, trimmedPassword);

      await bootstrapSession(response.token);
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Authentication failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [authMode, bootstrapSession, email, password, username]);

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!me?.id || !activeUserId || !content.trim()) {
        return;
      }

      const optimistic: ChatMessage = {
        id: `tmp-${Date.now()}`,
        sender: me.username,
        content,
        timestamp: new Date(),
        isOwn: true,
        avatar: me.avatar || fallbackAvatar(me.username),
      };

      setMessagesByUser((prev) => ({
        ...prev,
        [activeUserId]: [...(prev[activeUserId] || []), optimistic],
      }));

      emitMessage(activeUserId, {
        text: content,
        type: "text",
      });

      const target = userLookup[activeUserId];
      if (target) {
        setUsers((prev) => {
          const nextUser = {
            ...target,
            lastMessage: content,
            lastMessageType: "text" as const,
            lastMessageAt: new Date().toISOString(),
          };

          const withoutUser = prev.filter((user) => user.id !== activeUserId);
          return [nextUser, ...withoutUser];
        });
      }

      emitStopTyping(activeUserId);
    },
    [activeUserId, me, userLookup],
  );

  const handleUploadFile = useCallback(
    async (file: File, caption?: string) => {
      if (!me?.id || !token || !activeUserId) {
        return;
      }

      try {
        const uploaded = await uploadChatFile(token, file);

        const optimistic: ChatMessage = {
          id: `tmp-file-${Date.now()}`,
          sender: me.username,
          content: caption || "",
          timestamp: new Date(),
          isOwn: true,
          avatar: me.avatar || fallbackAvatar(me.username),
          type: uploaded.type,
          fileUrl: uploaded.fileUrl,
        };

        setMessagesByUser((prev) => ({
          ...prev,
          [activeUserId]: [...(prev[activeUserId] || []), optimistic],
        }));

        emitMessage(activeUserId, {
          text: caption || "",
          fileUrl: uploaded.fileUrl,
          type: uploaded.type,
        });

        const target = userLookup[activeUserId];
        if (target) {
          setUsers((prev) => {
            const nextUser = {
              ...target,
              lastMessage: caption || `Shared ${uploaded.type}`,
              lastMessageType: uploaded.type,
              lastMessageAt: new Date().toISOString(),
            };

            const withoutUser = prev.filter((user) => user.id !== activeUserId);
            return [nextUser, ...withoutUser];
          });
        }
      } catch (error) {
        setErrorText(error instanceof Error ? error.message : "Upload failed");
      }
    },
    [activeUserId, me, token, userLookup],
  );

  const handleTypingStart = useCallback(() => {
    if (!activeUserId) {
      return;
    }
    emitTyping(activeUserId);
  }, [activeUserId]);

  const handleTypingStop = useCallback(() => {
    if (!activeUserId) {
      return;
    }
    emitStopTyping(activeUserId);
  }, [activeUserId]);

  const handleSelectRoom = useCallback(
    (userId: string) => {
      setActiveUserId(userId);
      setUnreadByUser((prev) => {
        if (!prev[userId]) {
          return prev;
        }

        const next = { ...prev };
        delete next[userId];
        return next;
      });

      setUsers((prev) => {
        if (prev.some((user) => user.id === userId)) {
          return prev;
        }

        const candidate = searchResults.find((user) => user.id === userId);
        if (!candidate) {
          return prev;
        }

        return [
          {
            ...candidate,
            lastMessage: candidate.lastMessage || "",
            lastMessageAt:
              candidate.lastMessageAt ||
              candidate.createdAt ||
              new Date().toISOString(),
          },
          ...prev,
        ];
      });
    },
    [searchResults],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const existingToken = localStorage.getItem(TOKEN_KEY) || "";
    if (!existingToken || bootstrappedTokenRef.current === existingToken) {
      return;
    }

    bootstrappedTokenRef.current = existingToken;

    void bootstrapSession(existingToken);
  }, [bootstrapSession]);

  useEffect(() => {
    if (screen !== "chat" || !token || !me?.id || socketBoundRef.current) {
      return;
    }

    const socket = initSocket();
    socket.emit("join", { userId: me.id });
    socketBoundRef.current = true;

    const unsubscribeMessage = onReceiveMessage((payload) => {
      const senderId = String(payload?.sender || "");
      const receiverId = String(payload?.receiverId || me.id);
      const roomId = senderId === me.id ? receiverId : senderId;
      const latestLookup = userLookupRef.current;
      const otherUserId = senderId === me.id ? receiverId : senderId;

      const incoming: ChatMessage = {
        id: payload?.id || `${Date.now()}`,
        sender:
          senderId === me.id
            ? me.username
            : latestLookup[senderId]?.username || "User",
        content: payload?.content || "",
        timestamp: new Date(payload?.timestamp || Date.now()),
        isOwn: senderId === me.id,
        type: payload?.type,
        fileUrl: payload?.fileUrl,
        delivered: payload?.delivered,
        seen: payload?.seen,
        avatar:
          senderId === me.id
            ? me.avatar || fallbackAvatar(me.username)
            : latestLookup[senderId]?.avatar ||
              fallbackAvatar(latestLookup[senderId]?.username || "user"),
      };

      setMessagesByUser((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), incoming],
      }));

      if (senderId !== me.id && roomId !== activeUserIdRef.current) {
        setUnreadByUser((prev) => ({
          ...prev,
          [roomId]: (prev[roomId] || 0) + 1,
        }));
      }

      const target = latestLookup[otherUserId];
      if (target) {
        setUsers((prev) => {
          const nextUser = {
            ...target,
            lastMessage:
              incoming.content || `Shared ${incoming.type || "file"}`,
            lastMessageType: (incoming.type || "text") as
              | "text"
              | "image"
              | "video"
              | "document",
            lastMessageAt: new Date().toISOString(),
          };

          const withoutUser = prev.filter((user) => user.id !== otherUserId);
          return [nextUser, ...withoutUser];
        });
      }
    });

    const unsubscribePresence = onUserOnlineStatus((payload) => {
      const userId = String(payload?.userId || "");
      const online = Boolean(payload?.online);

      if (!userId) {
        return;
      }

      setUsers((prev) =>
        prev.map((item) => (item.id === userId ? { ...item, online } : item)),
      );
    });

    const unsubscribeTyping = onTypingIndicator((payload) => {
      const fromUserId = String(payload?.fromUserId || "");
      if (fromUserId && fromUserId === activeUserIdRef.current) {
        setIsTyping(true);
      }
    });

    const unsubscribeStopTyping = onStopTypingIndicator((payload) => {
      const fromUserId = String(payload?.fromUserId || "");
      if (fromUserId && fromUserId === activeUserIdRef.current) {
        setIsTyping(false);
      }
    });

    const unsubscribeSent = onMessageSent((payload) => {
      const senderId = String(payload?.senderId || "");
      const receiverId = String(payload?.receiverId || "");

      if (!senderId || senderId !== me.id || !receiverId) {
        return;
      }

      setMessagesByUser((prev) => {
        const roomMessages = prev[receiverId] || [];
        if (!roomMessages.length) {
          return prev;
        }

        const nextMessages = [...roomMessages];
        const latestOwnIdx = [...nextMessages]
          .reverse()
          .findIndex((item) => item.isOwn);

        if (latestOwnIdx === -1) {
          return prev;
        }

        const idx = nextMessages.length - 1 - latestOwnIdx;
        nextMessages[idx] = {
          ...nextMessages[idx],
          delivered: Boolean(payload?.delivered),
          seen: Boolean(payload?.seen),
        };

        return {
          ...prev,
          [receiverId]: nextMessages,
        };
      });
    });

    const unsubscribeDeviceConnected = onDeviceConnected(() => {
      setErrorText("");
    });

    return () => {
      unsubscribeMessage();
      unsubscribePresence();
      unsubscribeTyping();
      unsubscribeStopTyping();
      unsubscribeSent();
      unsubscribeDeviceConnected();
      closeSocket();
      socketBoundRef.current = false;
    };
  }, [me, screen, token]);

  useEffect(() => {
    if (!token || !activeUserId || messagesByUser[activeUserId]) {
      return;
    }

    void loadMessagesForUser(token, activeUserId);
  }, [activeUserId, loadMessagesForUser, messagesByUser, token]);

  useEffect(() => {
    if (screen !== "chat" || !token) {
      return;
    }

    const url = new URL(window.location.href);
    const pairToken = url.searchParams.get("pairToken")?.trim() || "";

    if (!pairToken || handledPairTokenRef.current === pairToken) {
      return;
    }

    handledPairTokenRef.current = pairToken;

    const connectFromScan = async () => {
      try {
        await connectViaQrToken(token, pairToken);
      } catch (error) {
        setErrorText(
          error instanceof Error ? error.message : "Failed to connect device",
        );
      } finally {
        url.searchParams.delete("pairToken");
        window.history.replaceState({}, "", url.toString());
      }
    };

    void connectFromScan();
  }, [screen, token]);

  useEffect(() => {
    if (screen !== "chat" || !token || !me?.id) {
      return;
    }

    const query = userSearch.trim();
    if (!query) {
      setSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearchingUsers(true);
        const { users: fetchedUsers } = await getUsers(token, query);

        setSearchResults(
          fetchedUsers.filter(
            (candidate) => !users.some((item) => item.id === candidate.id),
          ),
        );
      } catch (error) {
        setErrorText(
          error instanceof Error ? error.message : "Failed to search users",
        );
      } finally {
        setIsSearchingUsers(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [me, screen, token, userSearch, users]);

  if (isBootstrapping) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 sm:px-6 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-16 top-12 h-44 w-44 rounded-full bg-primary/18 blur-3xl animate-float" />
          <div className="absolute right-0 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-accent/14 blur-3xl animate-float-delayed" />
          <div className="absolute bottom-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-secondary/18 blur-3xl animate-pulse-soft" />
        </div>

        <div className="relative w-full max-w-md rounded-[2rem] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.14)] p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 rounded-2xl bg-background/70 border border-border overflow-hidden">
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-70" />
              <div className="absolute inset-3 rounded-xl bg-primary/55 animate-pulse-soft" />
            </div>

            <div className="flex-1">
              <div className="h-3 w-24 rounded-full bg-muted/70 animate-shimmer" />
              <div className="mt-3 h-5 w-40 rounded-full bg-muted/80 animate-shimmer" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="h-3 w-full rounded-full bg-background/80 border border-border/60 overflow-hidden">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary via-accent to-secondary animate-pulse-soft" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="h-16 rounded-2xl bg-background/70 border border-border/60 animate-shimmer" />
              <div className="h-16 rounded-2xl bg-background/70 border border-border/60 animate-shimmer [animation-delay:150ms]" />
              <div className="h-16 rounded-2xl bg-background/70 border border-border/60 animate-shimmer [animation-delay:300ms]" />
            </div>

            <p className="pt-2 text-sm text-muted-foreground text-center">
              Loading your Syncly workspace...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "chat") {
    return (
      <main className="h-screen w-screen overflow-hidden bg-background text-foreground">
        <div className="h-16 border-b border-border bg-card/70 backdrop-blur-md flex items-center justify-between px-4 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Syncly
            </p>
            <p className="font-medium">
              {me?.username}{" "}
              {/*<span className="text-muted-foreground">({me?.email})</span> */}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label="Toggle theme"
            >
              {themeToggleIcon}
            </Button>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>

        <div className="h-[calc(100vh-4rem)]">
          <ChatLayout
            rooms={roomList}
            activeRoomId={activeUserId}
            messages={activeMessages}
            userSearch={userSearch}
            searchResults={searchResults.map((user) => ({
              id: user.id,
              name: user.username,
              unreadCount: 0,
              lastMessage: user.online ? "Online" : "Tap to start chat",
              timestamp: new Date(user.createdAt || Date.now()),
              avatar: user.avatar || fallbackAvatar(user.username),
              subtitle: user.online ? "Online" : "Offline",
            }))}
            onUserSearchChange={setUserSearch}
            isSearchingUsers={isSearchingUsers}
            onSelectRoom={handleSelectRoom}
            onSendMessage={handleSendMessage}
            onUploadFile={handleUploadFile}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            isTyping={isTyping}
            token={token}
            onLogout={logout}
          />
        </div>
      </main>
    );
  }

  if (screen === "auth") {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">Syncly</h1>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label="Toggle theme"
            >
              {themeToggleIcon}
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Welcome Back
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                A clean workspace for real conversations.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Sign up with email and password. Your app owns the login flow,
                and users immediately get access to their profile, chats,
                presence, uploads, and real-time messaging.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {landingPoints.map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground"
                  >
                    {point}
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">
                    Email
                  </label>
                  <Input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    type="email"
                  />
                </div>

                {authMode === "register" && (
                  <div>
                    <label className="mb-2 block text-sm text-muted-foreground">
                      Username
                    </label>
                    <Input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="your_username"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">
                    Password
                  </label>
                  <Input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    type="password"
                  />
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={() => void handleSubmitAuth()}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Please wait..."
                    : authMode === "register"
                      ? "Create account"
                      : "Sign in"}
                  {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                </Button>

                {errorText && (
                  <p className="text-sm text-destructive">{errorText}</p>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-center rounded-full border-border/70 bg-background/70 text-foreground shadow-none hover:bg-accent/70"
                  onClick={() =>
                    setAuthMode((current) =>
                      current === "login" ? "register" : "login",
                    )
                  }
                >
                  {authMode === "login"
                    ? "Need an account? Create one"
                    : "Already have an account? Sign in"}
                </Button>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-gradient-to-b from-card to-background p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                What You Get
              </p>
              <div className="mt-4 space-y-4">
                {featureCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-border bg-card/70 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-accent/20 p-2">
                        <card.icon className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">{card.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Syncly</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            aria-label="Toggle theme"
          >
            {themeToggleIcon}
          </Button>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-10 md:px-10 md:py-14">
          <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />

          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Production-Ready Messaging
          </p>
          <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            A clean place to talk, share, and stay in touch.
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Syncly keeps conversations simple, fast, and organized so you can
            focus on people instead of settings.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => setScreen("auth")}>
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setScreen("auth")}
            >
              Sign In
            </Button>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {featureCards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="mb-3 inline-flex rounded-lg bg-accent/20 p-2">
                <card.icon className="h-4 w-4 text-accent" />
              </div>
              <h3 className="text-lg font-medium tracking-tight">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {card.description}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

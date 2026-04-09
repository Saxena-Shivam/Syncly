import React from "react";
import { ChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Download, ExternalLink, FileText } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const showImage = message.type === "image" && message.fileUrl;
  const showVideo = message.type === "video" && message.fileUrl;
  const showDocument = message.type === "document" && message.fileUrl;

  const documentName = showDocument
    ? decodeURIComponent((message.fileUrl || "").split("/").pop() || "Document")
    : "";
  const documentExtension = showDocument
    ? (documentName.split(".").pop() || "file").toUpperCase()
    : "";

  return (
    <div
      className={cn(
        "flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2",
        message.isOwn && "flex-row-reverse",
      )}
    >
      {/* Avatar */}
      {message.avatar && (
        <img
          src={message.avatar}
          alt={message.sender}
          className="w-8 h-8 rounded-full flex-shrink-0"
          crossOrigin="anonymous"
        />
      )}

      <div className={cn("flex flex-col gap-1", message.isOwn && "items-end")}>
        {/* Sender Name */}
        <span className="text-xs font-medium text-muted-foreground px-2">
          {message.sender}
        </span>

        {/* Message Bubble */}
        <div
          className={cn(
            "px-4 py-2 rounded-lg max-w-xs break-words",
            message.isOwn
              ? "bg-accent text-accent-foreground rounded-br-none"
              : "bg-card text-card-foreground rounded-bl-none",
          )}
        >
          {showImage ? (
            <div className="space-y-2">
              <a href={message.fileUrl} target="_blank" rel="noreferrer">
                <img
                  src={message.fileUrl}
                  alt={message.content || "Shared image"}
                  className="max-h-64 w-full rounded-md object-cover"
                />
              </a>
              <div className="flex items-center gap-2">
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium",
                    message.isOwn
                      ? "bg-accent-foreground/20 hover:bg-accent-foreground/30"
                      : "bg-muted hover:bg-muted/80",
                  )}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </a>

                <a
                  href={message.fileUrl}
                  download
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium",
                    message.isOwn
                      ? "bg-accent-foreground/20 hover:bg-accent-foreground/30"
                      : "bg-muted hover:bg-muted/80",
                  )}
                >
                  <Download className="h-3.5 w-3.5" />
                  Save
                </a>
              </div>
            </div>
          ) : null}

          {showVideo ? (
            <video controls className="max-h-64 w-full rounded-md">
              <source src={message.fileUrl} />
              Your browser cannot play this video.
            </video>
          ) : null}

          {showDocument ? (
            <div
              className={cn(
                "rounded-md border p-2.5 text-sm",
                message.isOwn
                  ? "border-accent-foreground/30 bg-accent-foreground/10"
                  : "border-border bg-background/70",
              )}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={cn(
                    "mt-0.5 rounded-md p-1.5",
                    message.isOwn ? "bg-accent-foreground/15" : "bg-muted",
                  )}
                >
                  <FileText className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium" title={documentName}>
                    {documentName}
                  </p>
                  <p
                    className={cn(
                      "text-[11px] mt-0.5",
                      message.isOwn
                        ? "text-accent-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    {documentExtension} document
                  </p>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium",
                    message.isOwn
                      ? "bg-accent-foreground/20 hover:bg-accent-foreground/30"
                      : "bg-muted hover:bg-muted/80",
                  )}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </a>

                <a
                  href={message.fileUrl}
                  download
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium",
                    message.isOwn
                      ? "bg-accent-foreground/20 hover:bg-accent-foreground/30"
                      : "bg-muted hover:bg-muted/80",
                  )}
                >
                  <Download className="h-3.5 w-3.5" />
                  Save
                </a>
              </div>
            </div>
          ) : null}

          {message.content ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : null}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground px-2">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {message.isOwn
            ? message.seen
              ? " · Seen"
              : message.delivered
                ? " · Delivered"
                : " · Sent"
            : ""}
        </span>
      </div>
    </div>
  );
}

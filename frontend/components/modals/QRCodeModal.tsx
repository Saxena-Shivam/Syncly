import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { connectViaQrToken, generateQrToken } from "@/lib/api";
import QRCode from "qrcode";

interface QRCodeModalProps {
  token: string;
  onClose: () => void;
}

export default function QRCodeModal({ token, onClose }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [pairingToken, setPairingToken] = useState("");
  const [pairingExpiresAt, setPairingExpiresAt] = useState<number | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const loadQr = async () => {
      if (!token) {
        setErrorText("Missing session token");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorText("");

      try {
        const { token: generatedToken, expiresAt } =
          await generateQrToken(token);
        const appBaseUrl = window.location.origin;
        const payload = `${appBaseUrl}/?pairToken=${encodeURIComponent(generatedToken)}`;

        const url = await QRCode.toDataURL(payload, {
          margin: 1,
          width: 220,
        });

        setPairingToken(generatedToken);
        setPairingExpiresAt(expiresAt);
        setQrDataUrl(url);
      } catch (error) {
        setErrorText(
          error instanceof Error ? error.message : "Failed to generate QR",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadQr();
  }, [token]);

  const extractPairingToken = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    if (trimmed.startsWith("syncly-pair:")) {
      return trimmed.slice("syncly-pair:".length).trim();
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.token === "string") {
        return parsed.token.trim();
      }
    } catch (_error) {
      // Ignore parse errors and continue with URL/raw token parsing.
    }

    try {
      const maybeUrl = new URL(trimmed);
      const tokenFromQuery =
        maybeUrl.searchParams.get("pairToken") ||
        maybeUrl.searchParams.get("token");
      if (tokenFromQuery) {
        return tokenFromQuery.trim();
      }
    } catch (_error) {
      // Not a URL.
    }

    return trimmed;
  };

  const handleCopyToken = async () => {
    if (!pairingToken) {
      return;
    }

    try {
      await navigator.clipboard.writeText(pairingToken);
    } catch (error) {
      setErrorText("Could not copy token to clipboard");
    }
  };

  const handleManualConnect = async () => {
    const toConnect = extractPairingToken(manualToken);
    if (!toConnect) {
      return;
    }

    setIsConnecting(true);
    setErrorText("");

    try {
      await connectViaQrToken(token, toConnect);
      setManualToken("");
      onClose();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Failed to connect device",
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const expiresInText = pairingExpiresAt
    ? `${Math.max(0, Math.round((pairingExpiresAt - Date.now()) / 1000))}s`
    : "-";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in-0">
      <div className="bg-card rounded-lg p-6 w-96 animate-in zoom-in-95 slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Scan to Join Chat
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center mb-6">
          {isLoading ? (
            <div className="h-[220px] w-[220px] rounded-lg border-2 border-border flex items-center justify-center text-sm text-muted-foreground">
              Generating QR...
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Syncly pairing QR"
              className="border-2 border-border rounded-lg"
            />
          ) : (
            <div className="h-[220px] w-[220px] rounded-lg border-2 border-border flex items-center justify-center text-sm text-destructive">
              QR unavailable
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground text-center mb-2">
          Scan this QR with another Syncly client to pair this session.
        </p>

        <p className="text-xs text-muted-foreground text-center mb-4">
          Pairing token expires in {expiresInText}
        </p>

        <div className="mb-4">
          <input
            value={manualToken}
            onChange={(event) => setManualToken(event.target.value)}
            placeholder="Paste scanned value or pairing token"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        {errorText ? (
          <p className="text-sm text-destructive mb-4 text-center">
            {errorText}
          </p>
        ) : null}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleCopyToken()}
            className="flex-1"
          >
            Copy Token
          </Button>
          <Button
            onClick={() => void handleManualConnect()}
            disabled={isConnecting || !manualToken.trim()}
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </Button>
        </div>
      </div>
    </div>
  );
}

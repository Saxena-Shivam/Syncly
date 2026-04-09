const { v4: uuidv4 } = require("uuid");
const env = require("../config/env");

const pairingSessions = new Map();

const createPairingToken = (ownerUserId) => {
  const token = uuidv4();
  const expiresAt = Date.now() + env.qrTokenTtlMs;

  pairingSessions.set(token, {
    token,
    ownerUserId,
    createdAt: Date.now(),
    expiresAt,
    used: false,
  });

  return { token, expiresAt };
};

const consumePairingToken = (token, connectedUserId) => {
  const session = pairingSessions.get(token);

  if (!session) {
    return { ok: false, reason: "Invalid token" };
  }

  if (session.used) {
    return { ok: false, reason: "Token already used" };
  }

  if (Date.now() > session.expiresAt) {
    pairingSessions.delete(token);
    return { ok: false, reason: "Token expired" };
  }

  session.used = true;
  session.connectedUserId = connectedUserId;
  pairingSessions.set(token, session);

  return { ok: true, session };
};

const pruneExpiredTokens = () => {
  const now = Date.now();
  for (const [token, session] of pairingSessions.entries()) {
    if (session.used || now > session.expiresAt) {
      pairingSessions.delete(token);
    }
  }
};

setInterval(pruneExpiredTokens, 30 * 1000).unref();

module.exports = {
  createPairingToken,
  consumePairingToken,
};

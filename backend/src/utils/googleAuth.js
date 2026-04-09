const { OAuth2Client } = require("google-auth-library");
const env = require("../config/env");

let googleClient = null;
if (env.googleClientId) {
  googleClient = new OAuth2Client(env.googleClientId);
}

const verifyGoogleToken = async (idToken) => {
  if (!idToken || typeof idToken !== "string") {
    throw new Error("Missing Google token");
  }

  // Development fallback to unblock integration before full Google setup.
  if (!googleClient) {
    return {
      sub: `mock-${idToken.slice(0, 12)}`,
      email: `user-${idToken.slice(0, 8)}@syncly.local`,
      picture: "",
      name: "",
    };
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload?.email) {
    throw new Error("Invalid Google token payload");
  }

  return payload;
};

module.exports = {
  verifyGoogleToken,
};

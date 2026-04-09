const onlineUsers = new Map();

const markOnline = (userId, socketId) => {
  const current = onlineUsers.get(userId) || new Set();
  current.add(socketId);
  onlineUsers.set(userId, current);
};

const markOffline = (userId, socketId) => {
  const current = onlineUsers.get(userId);
  if (!current) {
    return false;
  }

  current.delete(socketId);
  if (current.size === 0) {
    onlineUsers.delete(userId);
    return true;
  }

  onlineUsers.set(userId, current);
  return false;
};

const isUserOnline = (userId) => onlineUsers.has(userId);

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

module.exports = {
  markOnline,
  markOffline,
  isUserOnline,
  getOnlineUserIds,
};

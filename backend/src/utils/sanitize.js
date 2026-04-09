const cleanString = (value, maxLength = 5000) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[<>]/g, "").trim().slice(0, maxLength);
};

const isValidUsername = (username) => {
  return /^[a-zA-Z0-9_]{3,24}$/.test(username);
};

module.exports = {
  cleanString,
  isValidUsername,
};

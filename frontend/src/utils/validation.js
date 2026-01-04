export const validateEmail = (email) => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password) => {
    if (!password) return false;
    return password.length >= 6;
};

export const validatePhone = (phone) => {
    if (!phone) return true; // Opcional
    return /^\+?[\d\s()\/-]+$/.test(phone);
};

export const validateUsername = (username) => {
    if (!username) return false;
    return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
};

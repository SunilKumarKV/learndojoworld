const ACCESS_TOKEN_KEY = 'learndojo.accessToken';
const REFRESH_TOKEN_KEY = 'learndojo.refreshToken';

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function readStoredTokens() {
  const storage = getStorage();

  if (!storage) {
    return {
      accessToken: null,
      refreshToken: null,
    };
  }

  return {
    accessToken: storage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: storage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function storeTokens(tokens) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearStoredTokens() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
}

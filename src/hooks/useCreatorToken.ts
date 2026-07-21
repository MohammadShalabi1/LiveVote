import { useMemo } from 'react';

const STORAGE_KEY = 'livevote:creator_token';

export function useCreatorToken() {
  return useMemo(() => {
    let token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, token);
    }
    return token;
  }, []);
}

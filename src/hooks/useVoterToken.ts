import { useMemo } from 'react';

const STORAGE_KEY = 'livevote:voter_token';

export function useVoterToken() {
  return useMemo(() => {
    let token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, token);
    }
    return token;
  }, []);
}

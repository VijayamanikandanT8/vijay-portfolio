import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";
import type { SiteData } from "../types/site";

interface State {
  data: SiteData | null;
  error: string | null;
  loading: boolean;
}

const CACHE_KEY = "site-data-v1";

function readCache(): SiteData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as SiteData) : null;
  } catch {
    return null;
  }
}

export function useSiteData(): State {
  const [state, setState] = useState<State>(() => {
    const cached = readCache();
    return cached ? { data: cached, error: null, loading: false } : { data: null, error: null, loading: true };
  });

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    const hadCache = readCache() !== null;

    const load = (attempt: number) => {
      fetch(apiUrl("/api/site"))
        .then((res) => {
          if (!res.ok) throw new Error(`API responded with ${res.status}`);
          return res.json();
        })
        .then((data: SiteData) => {
          if (cancelled) return;
          const json = JSON.stringify(data);
          let same = false;
          try {
            same = localStorage.getItem(CACHE_KEY) === json;
            localStorage.setItem(CACHE_KEY, json);
          } catch {
            /* storage blocked: fine */
          }
          if (!hadCache || !same) setState({ data, error: null, loading: false });
        })
        .catch((err: Error) => {
          if (cancelled) return;
          if (attempt < 6) {
            // free hosts sleep; keep trying while the server wakes up
            timer = window.setTimeout(() => load(attempt + 1), 4000);
          } else if (!hadCache) {
            setState({ data: null, error: err.message, loading: false });
          }
        });
    };
    load(0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return state;
}
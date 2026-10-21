import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";
import type { SiteData } from "../types/site";

interface State {
  data: SiteData | null;
  error: string | null;
  loading: boolean;
}

export function useSiteData(): State {
  const [state, setState] = useState<State>({ data: null, error: null, loading: true });

  useEffect(() => {
    let cancelled = false;

    fetch(apiUrl("/api/site"))
      .then((res) => {
        if (!res.ok) throw new Error(`API responded with ${res.status}`);
        return res.json();
      })
      .then((data: SiteData) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, error: err.message, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

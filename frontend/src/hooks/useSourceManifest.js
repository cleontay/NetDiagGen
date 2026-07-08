import { useEffect, useState } from 'react';

// Fetches public/sources/manifest.json, which lists the JSON files bundled
// with the app so they can be picked from a dropdown instead of uploaded.
export function useSourceManifest() {
  const [sources, setSources] = useState([]);

  useEffect(() => {
    let cancelled = false;

    fetch('/sources/manifest.json')
      .then((res) => (res.ok ? res.json() : { sources: [] }))
      .then((data) => {
        if (!cancelled) setSources(data.sources ?? []);
      })
      .catch(() => {
        if (!cancelled) setSources([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return sources;
}

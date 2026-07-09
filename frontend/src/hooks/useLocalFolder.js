import { useCallback, useState } from 'react';

// Wraps the File System Access API so the user can point the app at a local
// folder of network JSON files, similar to the bundled sources/ folder but
// without needing to be shipped with the app or listed in a manifest.
// Unsupported in Firefox/Safari as of writing — callers should feature-gate
// on `isSupported`.
export function useLocalFolder() {
  const isSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  const [files, setFiles] = useState([]);
  const [folderName, setFolderName] = useState(null);

  const pickFolder = useCallback(async () => {
    if (!isSupported) return;
    let dirHandle;
    try {
      dirHandle = await window.showDirectoryPicker();
    } catch (err) {
      if (err.name === 'AbortError') return;
      throw err;
    }

    const found = [];
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'file' && name.toLowerCase().endsWith('.json')) {
        found.push({ name, handle });
      }
    }
    found.sort((a, b) => a.name.localeCompare(b.name));

    setFolderName(dirHandle.name);
    setFiles(found);
  }, [isSupported]);

  const readFile = useCallback(async (fileEntry) => {
    const file = await fileEntry.handle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  }, []);

  return { isSupported, folderName, files, pickFolder, readFile };
}

// Images on Pages stay in IndexedDB. No credentials, API calls or uploads are involved.
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nexo-local-assets', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('images');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Armazenamento de imagens indisponível.'));
  });
}
export async function storeImage(file: Blob, id = `local-image:${crypto.randomUUID()}`) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('images', 'readwrite');
      tx.objectStore('images').put(file, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return id;
  } finally {
    db.close();
  }
}
export async function readImage(id: string): Promise<Blob | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('images', 'readonly');
      const r = tx.objectStore('images').get(id);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  } finally {
    db.close();
  }
}
export async function imageData(id: string) {
  const file = await readImage(id);
  if (!file)
    throw new Error(
      'Uma imagem local não está mais disponível. Selecione-a novamente antes de exportar.',
    );
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

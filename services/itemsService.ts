import type { Item, NewItemInput } from "@/types";

/**
 * Client-service for ting.
 *
 * Spillet og UI-et kaller disse funksjonene — aldri `fetch` direkte. Da ligger
 * alle endepunkt-URL-er ett sted, og et bytte av backend merkes ikke oppover.
 *
 * Slik ville en React-komponent brukt den (komponenten bygges et annet sted):
 *
 * ```tsx
 * const [saving, setSaving] = useState(false);
 * const [error, setError] = useState<string | null>(null);
 *
 * async function handleSubmit(event: FormEvent<HTMLFormElement>) {
 *   event.preventDefault();
 *   setSaving(true);
 *   setError(null);
 *   try {
 *     const item = await addItem({
 *       roomId: "stue",
 *       name: "Gulvlampe",
 *       price: 1290,
 *       status: "wished",
 *     });
 *     onItemAdded(item); // legg den nye tingen i lista / oppdater budsjettet
 *   } catch (e) {
 *     setError(e instanceof Error ? e.message : "Kunne ikke lagre");
 *   } finally {
 *     setSaving(false);
 *   }
 * }
 * ```
 */

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { cache: "no-store", ...init });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Forespørselen feilet (${response.status})`);
  }

  // 204 (f.eks. sletting) har ingen kropp å parse.
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

/** Henter ting — alle, eller bare de som hører til ett rom. */
export function fetchItems(roomId?: string): Promise<Item[]> {
  const query = roomId ? `?roomId=${encodeURIComponent(roomId)}` : "";
  return request<Item[]>(`/api/items${query}`);
}

/**
 * Legger til en ny ting i et rom. Kaster `Error` med feilmeldingen fra
 * serveren hvis valideringen ryker (400) eller rommet ikke finnes (404).
 */
export function addItem(input: NewItemInput): Promise<Item> {
  return request<Item>("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

/** Sletter en ting. Kaster `Error` hvis den ikke finnes (404). */
export function deleteItem(itemId: string): Promise<void> {
  return request<void>(`/api/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}

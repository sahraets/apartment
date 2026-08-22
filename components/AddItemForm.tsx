"use client";

import { useState, type FormEvent } from "react";

import { addItem } from "@/services/itemsService";
import {
  FURNITURE_KINDS,
  FURNITURE_KIND_LABELS,
  ITEM_STATUSES,
  ITEM_STATUS_LABELS,
  type FurnitureKind,
  type Item,
  type ItemStatus,
} from "@/types";
import styles from "./AddItemForm.module.css";

interface Props {
  roomId: string;
  /** Kalles når tingen er lagret — brukes til å hente budsjettet på nytt. */
  onAdded: (item: Item) => void;
  onCancel: () => void;
}

/**
 * Skjema for å legge til én ting i et rom.
 *
 * Lagringen går gjennom client-servicen, som igjen går via API-et — skjemaet
 * kjenner verken endepunkt eller database. Budsjettet regnes ut på serveren,
 * så etter lagring ber vi bare om ferske tall i stedet for å regne selv.
 */
export default function AddItemForm({ roomId, onAdded, onCancel }: Props) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<ItemStatus>("wished");
  /** Tom streng = ingen møbeltype, altså ingenting på kartet. */
  const [kind, setKind] = useState<FurnitureKind | "">("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const item = await addItem({
        roomId,
        name,
        // Tomt prisfelt betyr «hadde den fra før» — 0 kr, teller ikke på budsjettet.
        price: price.trim() === "" ? 0 : Number(price.replace(",", ".")),
        status,
        kind: kind || null,
        note: note.trim() || null,
      });

      setName("");
      setPrice("");
      setNote("");
      setStatus("wished");
      setKind("");
      onAdded(item);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke lagre");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>Hva er det?</span>
        <input
          className={styles.input}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="F.eks. gulvlampe"
          required
          autoFocus
        />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Pris</span>
          <input
            className={styles.input}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            inputMode="numeric"
            placeholder="0 = hadde den fra før"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Status</span>
          <select
            className={styles.input}
            value={status}
            onChange={(event) => setStatus(event.target.value as ItemStatus)}
          >
            {ITEM_STATUSES.map((value) => (
              <option key={value} value={value}>
                {ITEM_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Møbeltype</span>
        <select
          className={styles.input}
          value={kind}
          onChange={(event) => setKind(event.target.value as FurnitureKind | "")}
        >
          <option value="">Ingen — vises bare i lista</option>
          {FURNITURE_KINDS.map((value) => (
            <option key={value} value={value}>
              {FURNITURE_KIND_LABELS[value]}
            </option>
          ))}
        </select>
        <span className={styles.hint}>
          Velger du en type, dukker møbelet opp i leiligheten.
        </span>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Notat</span>
        <input
          className={styles.input}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Valgfritt"
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button className={styles.primary} type="submit" disabled={saving}>
          {saving ? "Lagrer …" : "Legg til"}
        </button>
        <button
          className={styles.secondary}
          type="button"
          onClick={onCancel}
          disabled={saving}
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}

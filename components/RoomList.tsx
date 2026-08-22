"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import AddItemForm from "./AddItemForm";
import { barWidth, budgetTone, formatNok } from "@/services/budgetService";
import { notifyItemsChanged } from "@/services/itemsEvents";
import { deleteItem, fetchItems } from "@/services/itemsService";
import { fetchRooms, type RoomsResult } from "@/services/roomsService";
import { ITEM_STATUS_LABELS, type Item } from "@/types";
import styles from "./RoomList.module.css";

/**
 * Oversikt over rommene, med tingene i hvert rom og skjema for å legge til nye.
 *
 * All data hentes via client-servicene, aldri med `fetch` direkte. Budsjettet
 * regnes ut på serveren, så når en ting er lagret henter vi rom og ting på
 * nytt i stedet for å oppdatere tallene lokalt — da kan de ikke komme i utakt.
 */
export default function RoomList() {
  const [data, setData] = useState<RoomsResult | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openRoomId, setOpenRoomId] = useState<string | null>(null);
  /** Tingen som venter på «sikker?»-bekreftelse. */
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const mounted = useRef(true);

  // Setter state først når svaret er tilbake, aldri synkront i effekten.
  const load = useCallback(() => {
    Promise.all([fetchRooms(), fetchItems()])
      .then(([rooms, allItems]) => {
        if (!mounted.current) return;
        setData(rooms);
        setItems(allItems);
        setError(null);
      })
      .catch((e: Error) => {
        if (mounted.current) setError(e.message);
      });
  }, []);

  const remove = useCallback(
    (itemId: string) => {
      setBusyId(itemId);
      deleteItem(itemId)
        .then(() => {
          if (!mounted.current) return;
          setConfirmingId(null);
          load();
          notifyItemsChanged();
        })
        .catch((e: Error) => {
          if (mounted.current) setError(e.message);
        })
        .finally(() => {
          if (mounted.current) setBusyId(null);
        });
    },
    [load],
  );

  useEffect(() => {
    mounted.current = true;
    load();

    return () => {
      mounted.current = false;
    };
  }, [load]);

  if (error) return <p className={styles.message}>Klarte ikke hente rom: {error}</p>;
  if (!data || !items) return <p className={styles.message}>Laster …</p>;

  const budgetFor = (roomId: string) =>
    data.budgets.find((budget) => budget.roomId === roomId);

  const itemsFor = (roomId: string) =>
    items.filter((item) => item.roomId === roomId);

  return (
    <div className={styles.wrapper}>
      <header className={styles.summary}>
        <div>
          <span className={styles.summaryLabel}>Budsjett totalt</span>
          <strong className={styles.summaryValue}>
            {formatNok(data.summary.planned)}
          </strong>
        </div>
        <div>
          <span className={styles.summaryLabel}>Brukt</span>
          <strong className={styles.summaryValue}>
            {formatNok(data.summary.committed)}
          </strong>
        </div>
        <div>
          <span className={styles.summaryLabel}>Igjen</span>
          <strong className={styles.summaryValue}>
            {formatNok(data.summary.remaining)}
          </strong>
        </div>
      </header>

      <ul className={styles.rooms}>
        {data.rooms.map((room) => {
          const budget = budgetFor(room.id);
          if (!budget) return null;

          const roomItems = itemsFor(room.id);

          return (
            <li key={room.id} className={styles.room}>
              <div className={styles.roomHead}>
                <h2 className={styles.roomName}>{room.name}</h2>
                <span className={styles.roomNumbers}>
                  {formatNok(budget.committed)} av {formatNok(budget.planned)}
                </span>
              </div>

              <p className={styles.roomDescription}>{room.description}</p>

              <div className={styles.bar} data-tone={budgetTone(budget)}>
                <div
                  className={styles.barFill}
                  style={{ width: `${barWidth(budget)}%` }}
                />
              </div>

              <dl className={styles.stats}>
                <div>
                  <dt>Kjøpt</dt>
                  <dd>{formatNok(budget.spent)}</dd>
                </div>
                <div>
                  <dt>Ønsket</dt>
                  <dd>{formatNok(budget.wished)}</dd>
                </div>
                <div>
                  <dt>Igjen</dt>
                  <dd>{formatNok(budget.remaining)}</dd>
                </div>
              </dl>

              {roomItems.length > 0 && (
                <ul className={styles.items}>
                  {roomItems.map((item) => (
                    <li key={item.id} className={styles.item}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemStatus} data-status={item.status}>
                        {ITEM_STATUS_LABELS[item.status]}
                      </span>
                      <span className={styles.itemPrice}>
                        {item.price > 0 ? formatNok(item.price) : "fra før"}
                      </span>

                      {confirmingId === item.id ? (
                        <span className={styles.confirm}>
                          <button
                            className={styles.confirmYes}
                            type="button"
                            onClick={() => remove(item.id)}
                            disabled={busyId === item.id}
                          >
                            {busyId === item.id ? "Sletter …" : "Slett"}
                          </button>
                          <button
                            className={styles.confirmNo}
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            disabled={busyId === item.id}
                          >
                            Avbryt
                          </button>
                        </span>
                      ) : (
                        <button
                          className={styles.remove}
                          type="button"
                          onClick={() => setConfirmingId(item.id)}
                          aria-label={`Slett ${item.name}`}
                          title={`Slett ${item.name}`}
                        >
                          ×
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {openRoomId === room.id ? (
                <AddItemForm
                  roomId={room.id}
                  onAdded={() => {
                    setOpenRoomId(null);
                    load();
                    // Kartet henter sine egne ting — si ifra at det er nytt.
                    notifyItemsChanged();
                  }}
                  onCancel={() => setOpenRoomId(null)}
                />
              ) : (
                <button
                  className={styles.addButton}
                  type="button"
                  onClick={() => setOpenRoomId(room.id)}
                >
                  + Legg til ting
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

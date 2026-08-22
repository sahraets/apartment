import GameCanvas from "@/components/GameCanvas";
import RoomList from "@/components/RoomList";
import styles from "./page.module.css";


export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Leilighet-spillet</h1>
      <p className={styles.lead}>
        Foreløpig oversikt over rommene. Spillkartet kommer hit etter hvert.
      </p>
      <GameCanvas />
      <RoomList />
    </main>
  );
}
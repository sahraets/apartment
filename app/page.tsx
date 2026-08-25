import GameCanvas from "@/components/GameCanvas";
import RoomList from "@/components/RoomList";
import styles from "./page.module.css";


export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Planlegging for leiligheten vår</h1>
      <p className={styles.lead}>
        Oversikt over leiligheten vår, beveg deg rundt i rommene for å se hvilke
        møbler vi har kjøpt eller planlegger å kjøpe. Du kan legge til de møblene
        du vil ha i tabellene under. Husk budsjettet!
      </p>
      <GameCanvas />
      <RoomList />
    </main>
  );
}
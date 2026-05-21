import Link from "next/link";

import { slideDeck } from "./slides-data";
import styles from "./page.module.css";

export default function DiapositivasPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header>
          <div className={styles.topBar}>
            <span className={styles.badge}>Presentación AIOps Prime</span>
            <Link className={styles.topLink} href="/diapositivas/visual">
              Ver versión visual interactiva
            </Link>
          </div>

          <h1 className={styles.heading}>Diapositivas de la Presentación</h1>
          <p className={styles.subheading}>
            Vista simplificada de los títulos. Para la experiencia completa, ve a la versión visual interactiva.
          </p>
        </header>

        <div className={styles.slides}>
          {slideDeck.map((slide) => (
            <article className={styles.slide} key={slide.id}>
              <header className={styles.slideHeader}>
                <span className={styles.slideNumber}>{slide.id}</span>
                <h2 className={styles.slideTitle}>{slide.title}</h2>
              </header>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

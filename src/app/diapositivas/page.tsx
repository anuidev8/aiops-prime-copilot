import Link from "next/link";

import { slideDeck } from "./slides-data";
import styles from "./page.module.css";

export default function DiapositivasPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header>
          <div className={styles.topBar}>
            <span className={styles.badge}>Presentacion AIOps Prime</span>
            <Link className={styles.topLink} href="/diapositivas/visual">
              Ver version con imagenes
            </Link>
          </div>

          <h1 className={styles.heading}>Diapositivas para sustentacion</h1>
          <p className={styles.subheading}>
            Version minimalista en azul con foco en narrativa tecnica y notas de
            exposicion.
          </p>
        </header>

        <div className={styles.slides}>
          {slideDeck.map((slide) => (
            <article className={styles.slide} key={slide.id}>
              <header className={styles.slideHeader}>
                <span className={styles.slideNumber}>{slide.id}</span>
                <h2 className={styles.slideTitle}>{slide.title}</h2>
              </header>

              {slide.table ? (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        {slide.table.columns.map((column) => (
                          <th key={column} scope="col">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slide.table.rows.map((row, rowIndex) => (
                        <tr key={`${slide.id}-${rowIndex}`}>
                          {row.map((cell, cellIndex) => (
                            <td key={`${slide.id}-${rowIndex}-${cellIndex}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {slide.bullets ? (
                <ul className={styles.points}>
                  {slide.bullets.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : null}

              {slide.decision ? (
                <p className={styles.decision}>{slide.decision}</p>
              ) : null}

              {slide.closingLine ? (
                <p className={styles.closing}>{slide.closingLine}</p>
              ) : null}

              <p className={styles.speakerNote}>
                <strong>Nota para hablar:</strong> &quot;{slide.speakerNote}
                &quot;
              </p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

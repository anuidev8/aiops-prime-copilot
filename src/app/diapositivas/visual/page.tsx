"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

import { slideDeck } from "../slides-data";
import styles from "./page.module.css";

gsap.registerPlugin(useGSAP);

function SlideArt({ id }: { id: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 640 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={`bg-${id}`}
          x1="48"
          y1="32"
          x2="592"
          y2="328"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#DBEBFF" />
          <stop offset="1" stopColor="#BFD9FF" />
        </linearGradient>
        <linearGradient
          id={`shape-${id}`}
          x1="120"
          y1="70"
          x2="490"
          y2="290"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1D4ED8" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>

      <rect x="16" y="16" width="608" height="328" rx="26" fill={`url(#bg-${id})`} />
      <rect
        x="34"
        y="34"
        width="572"
        height="292"
        rx="18"
        stroke="#8FB4F8"
        strokeWidth="2"
      />

      {id === 1 ? (
        <>
          <circle cx="192" cy="180" r="70" fill={`url(#shape-${id})`} opacity="0.9" />
          <rect x="292" y="110" width="170" height="48" rx="14" fill="#2563EB" opacity="0.88" />
          <rect x="292" y="174" width="210" height="48" rx="14" fill="#1D4ED8" opacity="0.78" />
          <rect x="292" y="238" width="132" height="34" rx="12" fill="#38BDF8" opacity="0.85" />
          <circle cx="192" cy="180" r="26" fill="#E9F3FF" />
          <rect x="182" y="142" width="20" height="76" rx="8" fill="#0E5BDF" />
          <rect x="154" y="170" width="76" height="20" rx="8" fill="#0E5BDF" />
        </>
      ) : null}

      {id === 2 ? (
        <>
          <rect x="84" y="88" width="220" height="184" rx="16" fill="#1E40AF" opacity="0.12" />
          <rect x="114" y="122" width="156" height="14" rx="7" fill="#1D4ED8" />
          <rect x="114" y="154" width="132" height="14" rx="7" fill="#1D4ED8" opacity="0.82" />
          <rect x="114" y="186" width="170" height="14" rx="7" fill="#1D4ED8" opacity="0.72" />
          <rect x="114" y="218" width="118" height="14" rx="7" fill="#1D4ED8" opacity="0.62" />
          <circle cx="428" cy="178" r="72" fill={`url(#shape-${id})`} opacity="0.92" />
          <circle cx="428" cy="178" r="36" fill="#EAF3FF" />
          <rect
            x="458"
            y="208"
            width="58"
            height="16"
            rx="8"
            transform="rotate(38 458 208)"
            fill="#0B5AD5"
          />
          <circle cx="428" cy="178" r="12" fill="#0B5AD5" />
        </>
      ) : null}

      {id === 3 ? (
        <>
          <circle cx="320" cy="180" r="50" fill={`url(#shape-${id})`} />
          <circle cx="178" cy="110" r="34" fill="#2563EB" opacity="0.88" />
          <circle cx="466" cy="110" r="34" fill="#2563EB" opacity="0.88" />
          <circle cx="150" cy="256" r="34" fill="#1D4ED8" opacity="0.82" />
          <circle cx="320" cy="284" r="34" fill="#1D4ED8" opacity="0.82" />
          <circle cx="492" cy="256" r="34" fill="#1D4ED8" opacity="0.82" />
          <path d="M204 125L280 160" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" />
          <path d="M435 125L360 160" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" />
          <path d="M177 228L286 196" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" />
          <path d="M320 250L320 230" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" />
          <path d="M463 228L354 196" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" />
        </>
      ) : null}

      {id === 4 ? (
        <>
          <rect x="108" y="88" width="424" height="58" rx="14" fill="#2563EB" opacity="0.86" />
          <rect x="88" y="154" width="464" height="58" rx="14" fill="#1D4ED8" opacity="0.76" />
          <rect x="68" y="220" width="504" height="58" rx="14" fill="#0EA5E9" opacity="0.76" />
          <circle cx="140" cy="117" r="12" fill="#EAF2FF" />
          <circle cx="140" cy="183" r="12" fill="#EAF2FF" />
          <circle cx="140" cy="249" r="12" fill="#EAF2FF" />
          <rect x="170" y="108" width="232" height="18" rx="9" fill="#EAF2FF" opacity="0.9" />
          <rect x="170" y="174" width="250" height="18" rx="9" fill="#EAF2FF" opacity="0.9" />
          <rect x="170" y="240" width="268" height="18" rx="9" fill="#EAF2FF" opacity="0.9" />
        </>
      ) : null}

      {id === 5 ? (
        <>
          <circle cx="320" cy="180" r="66" fill={`url(#shape-${id})`} opacity="0.94" />
          <circle cx="188" cy="104" r="40" fill="#2563EB" opacity="0.82" />
          <circle cx="188" cy="256" r="40" fill="#1D4ED8" opacity="0.82" />
          <circle cx="464" cy="180" r="40" fill="#0EA5E9" opacity="0.82" />
          <path d="M224 122L266 146" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" />
          <path d="M224 238L266 214" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" />
          <path d="M424 180H386" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" />
          <rect x="291" y="162" width="58" height="36" rx="10" fill="#EAF3FF" />
          <rect x="299" y="170" width="42" height="8" rx="4" fill="#1D4ED8" />
          <rect x="299" y="182" width="26" height="8" rx="4" fill="#1D4ED8" opacity="0.8" />
        </>
      ) : null}

      {id === 6 ? (
        <>
          <path d="M86 228H554" stroke="#1E3A8A" strokeWidth="8" strokeLinecap="round" />
          <rect x="96" y="188" width="104" height="50" rx="12" fill="#2563EB" opacity="0.82" />
          <rect x="226" y="164" width="104" height="74" rx="12" fill="#1D4ED8" opacity="0.82" />
          <rect x="356" y="142" width="104" height="96" rx="12" fill="#0EA5E9" opacity="0.82" />
          <rect x="486" y="114" width="58" height="124" rx="12" fill="#38BDF8" opacity="0.85" />
          <circle cx="160" cy="124" r="32" fill="#EAF3FF" stroke="#1D4ED8" strokeWidth="8" />
          <path d="M146 124H174" stroke="#1D4ED8" strokeWidth="8" strokeLinecap="round" />
          <path d="M160 110V138" stroke="#1D4ED8" strokeWidth="8" strokeLinecap="round" />
        </>
      ) : null}

      {id === 7 ? (
        <>
          <rect x="76" y="86" width="132" height="58" rx="14" fill="#2563EB" opacity="0.86" />
          <rect x="254" y="86" width="132" height="58" rx="14" fill="#1D4ED8" opacity="0.86" />
          <rect x="432" y="86" width="132" height="58" rx="14" fill="#0EA5E9" opacity="0.86" />
          <rect x="166" y="214" width="132" height="58" rx="14" fill="#1D4ED8" opacity="0.78" />
          <rect x="344" y="214" width="132" height="58" rx="14" fill="#0EA5E9" opacity="0.78" />
          <path d="M208 115H245" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" />
          <path d="M386 115H423" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" />
          <path d="M320 145V205" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" />
          <path d="M320 205H298" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" />
          <path d="M320 205H342" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" />
        </>
      ) : null}

      {id === 8 ? (
        <>
          <rect x="92" y="110" width="144" height="140" rx="18" fill="#2563EB" opacity="0.85" />
          <rect x="248" y="84" width="144" height="166" rx="18" fill="#1D4ED8" opacity="0.85" />
          <rect x="404" y="126" width="144" height="124" rx="18" fill="#0EA5E9" opacity="0.85" />
          <path d="M236 178H248" stroke="#1E3A8A" strokeWidth="7" strokeLinecap="round" />
          <path d="M392 178H404" stroke="#1E3A8A" strokeWidth="7" strokeLinecap="round" />
          <circle cx="164" cy="180" r="18" fill="#EAF3FF" />
          <circle cx="320" cy="180" r="18" fill="#EAF3FF" />
          <circle cx="476" cy="180" r="18" fill="#EAF3FF" />
        </>
      ) : null}

      {id === 9 ? (
        <>
          <rect x="94" y="90" width="200" height="176" rx="16" fill="#2563EB" opacity="0.82" />
          <rect x="346" y="90" width="200" height="176" rx="16" fill="#0EA5E9" opacity="0.82" />
          <rect x="130" y="128" width="128" height="20" rx="10" fill="#EAF3FF" />
          <rect x="130" y="160" width="96" height="20" rx="10" fill="#EAF3FF" opacity="0.88" />
          <rect x="130" y="192" width="144" height="20" rx="10" fill="#EAF3FF" opacity="0.78" />
          <rect x="382" y="128" width="128" height="20" rx="10" fill="#EAF3FF" />
          <rect x="382" y="160" width="108" height="20" rx="10" fill="#EAF3FF" opacity="0.88" />
          <rect x="382" y="192" width="144" height="20" rx="10" fill="#EAF3FF" opacity="0.78" />
          <path
            d="M304 118L336 180L304 242"
            stroke="#1E3A8A"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}

      {id === 10 ? (
        <>
          <rect x="306" y="82" width="28" height="180" rx="12" fill="#1D4ED8" />
          <rect x="228" y="252" width="184" height="24" rx="12" fill="#1D4ED8" opacity="0.9" />
          <path d="M196 150H444" stroke="#1E3A8A" strokeWidth="8" strokeLinecap="round" />
          <path d="M222 150L188 230H256L222 150Z" fill="#2563EB" opacity="0.86" />
          <path d="M418 150L384 210H452L418 150Z" fill="#0EA5E9" opacity="0.86" />
          <circle cx="222" cy="137" r="14" fill="#EAF3FF" />
          <circle cx="418" cy="137" r="14" fill="#EAF3FF" />
        </>
      ) : null}
    </svg>
  );
}

export default function DiapositivasVisualPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const rootRef = useRef<HTMLDivElement>(null);
  const slide = slideDeck[currentIndex];

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slideDeck.length);
  }, []);

  const goPrevious = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slideDeck.length) % slideDeck.length);
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      if (index === currentIndex) {
        return;
      }

      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    },
    [currentIndex],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        goNext();
      }

      if (event.key === "ArrowLeft") {
        goPrevious();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrevious]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-slider-card]",
          {
            autoAlpha: 0,
            x: direction > 0 ? 54 : -54,
            scale: 0.985,
          },
          {
            autoAlpha: 1,
            x: 0,
            scale: 1,
            duration: 0.58,
            ease: "power3.out",
          },
        );

        gsap.fromTo(
          "[data-slide-item]",
          {
            autoAlpha: 0,
            y: 16,
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.42,
            ease: "power2.out",
            stagger: 0.055,
            delay: 0.1,
          },
        );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-slider-card], [data-slide-item]", { clearProps: "all" });
      });

      return () => {
        mm.revert();
      };
    },
    {
      scope: rootRef,
      dependencies: [currentIndex, direction],
      revertOnUpdate: true,
    },
  );

  return (
    <main className={styles.page}>
      <div className={styles.container} ref={rootRef}>
        <header>
          <div className={styles.topBar}>
            <span className={styles.badge}>Presentacion AIOps Prime</span>
            <Link className={styles.topLink} href="/diapositivas">
              Ver version sin imagenes
            </Link>
          </div>

          <h1 className={styles.heading}>Diapositivas visuales en slider GSAP</h1>
          <p className={styles.subheading}>
            Usa flechas del teclado o controles para navegar. Cada slide entra
            con transicion suave y direccional.
          </p>
        </header>

        <section className={styles.sliderMeta}>
          <span>
            Diapositiva <strong>{currentIndex + 1}</strong> de {slideDeck.length}
          </span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressValue}
              style={{ width: `${((currentIndex + 1) / slideDeck.length) * 100}%` }}
            />
          </div>
        </section>

        <article className={styles.slide} data-slider-card key={slide.id}>
          <div className={styles.slideGrid}>
            <section className={styles.content}>
              <header className={styles.slideHeader} data-slide-item>
                <span className={styles.slideNumber}>{slide.id}</span>
                <h2 className={styles.slideTitle}>{slide.title}</h2>
              </header>

              {slide.table ? (
                <div className={styles.tableWrap} data-slide-item>
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
                    <li data-slide-item key={point}>
                      {point}
                    </li>
                  ))}
                </ul>
              ) : null}

              {slide.decision ? (
                <p className={styles.decision} data-slide-item>
                  {slide.decision}
                </p>
              ) : null}

              {slide.closingLine ? (
                <p className={styles.closing} data-slide-item>
                  {slide.closingLine}
                </p>
              ) : null}

              <p className={styles.speakerNote} data-slide-item>
                <strong>Nota para hablar:</strong> &quot;{slide.speakerNote}&quot;
              </p>
            </section>

            <aside className={styles.artPanel} data-slide-item>
              <SlideArt id={slide.id} />
            </aside>
          </div>
        </article>

        <nav className={styles.controls} aria-label="Controles del slider">
          <button className={styles.controlButton} onClick={goPrevious} type="button">
            Anterior
          </button>
          <button className={styles.controlButton} onClick={goNext} type="button">
            Siguiente
          </button>
        </nav>

        <div className={styles.dots} aria-label="Ir a una diapositiva">
          {slideDeck.map((item, index) => (
            <button
              aria-label={`Ir a diapositiva ${item.id}`}
              aria-pressed={currentIndex === index}
              className={currentIndex === index ? styles.dotActive : styles.dot}
              key={item.id}
              onClick={() => goToSlide(index)}
              type="button"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

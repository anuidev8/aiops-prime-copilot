"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import {
  ChevronLeft, ChevronRight, CheckCircle2, Target, Database, Cloud, LineChart,
  Search, FileText, Lightbulb, MessageSquare, Layout, Rocket, ShieldCheck,
  BarChart3, BookOpen, Layers, Target as TargetIcon, ArrowRight, X,
  User, Check, Lock, Users, Monitor, Cpu, Network, Briefcase, BrainCircuit, Activity, HelpCircle, Plus,
  Palette, Sparkles, Code
} from "lucide-react";

import { slideDeck } from "../slides-data";
import styles from "./page.module.css";

gsap.registerPlugin(useGSAP);

function Slide1() {
  return (
    <div className={styles.flexCol} style={{ height: "100%" }}>
      <div className={styles.flexRow} style={{ flex: 1, gap: "2rem" }}>
        
        {/* LEFT COLUMN */}
        <div className={styles.wHalf} style={{ display: "flex", flexDirection: "column", gap: "1.5rem", zIndex: 2 }}>
          <p className={styles.slideSubtitle} style={{ marginBottom: "0.5rem" }}>Elegir bien hoy, construye<br/>valor mañana.</p>
          
          <div className={styles.flexCol} style={{ gap: "1.25rem" }}>
            <div className={styles.flexRow} style={{ gap: "1rem", alignItems: "flex-start" }}>
              <div className={styles.iconBox} style={{ background: "transparent", border: "none", color: "#a78bfa" }}><User size={24} /></div>
              <div>
                <div className={`${styles.fontBold} ${styles.textPurple}`}>FÁCIL Y ACCESIBLE</div>
                <div className={styles.textSm} style={{ color: "#cbd5e1" }}>Curva de aprendizaje baja.</div>
              </div>
            </div>
            
            <div className={styles.flexRow} style={{ gap: "1rem", alignItems: "flex-start" }}>
              <div className={styles.iconBox} style={{ background: "transparent", border: "none", color: "#a78bfa" }}><FileText size={24} /></div>
              <div>
                <div className={`${styles.fontBold} ${styles.textPurple}`}>DOCUMENTADA</div>
                <div className={styles.textSm} style={{ color: "#cbd5e1" }}>Comunidad activa y mucha<br/>documentación.</div>
              </div>
            </div>

            <div className={styles.flexRow} style={{ gap: "1rem", alignItems: "flex-start" }}>
              <div className={styles.iconBox} style={{ background: "transparent", border: "none", color: "#a78bfa" }}><Layers size={24} /></div>
              <div>
                <div className={`${styles.fontBold} ${styles.textPurple}`}>EJEMPLOS REALES</div>
                <div className={styles.textSm} style={{ color: "#cbd5e1" }}>Casos de uso y referencias<br/>que ya existen.</div>
              </div>
            </div>

            <div className={styles.flexRow} style={{ gap: "1rem", alignItems: "flex-start" }}>
              <div className={styles.iconBox} style={{ background: "transparent", border: "none", color: "#60a5fa" }}><Target size={24} /></div>
              <div>
                <div className={`${styles.fontBold} ${styles.textBlue}`}>ALINEADA AL NEGOCIO</div>
                <div className={styles.textSm} style={{ color: "#cbd5e1" }}>Que encaje con el producto<br/>y el tipo de servicio.</div>
              </div>
            </div>

            <div className={styles.flexRow} style={{ gap: "1rem", alignItems: "flex-start" }}>
              <div className={styles.iconBox} style={{ background: "transparent", border: "none", color: "#60a5fa" }}><BrainCircuit size={24} /></div>
              <div>
                <div className={`${styles.fontBold} ${styles.textBlue}`}>MIS HABILIDADES</div>
                <div className={styles.textSm} style={{ color: "#cbd5e1" }}>Hacer match entre lo que sé<br/>y la tecnología a usar.</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.wHalf} style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          
          {/* Abstract Dashboard UI Background */}
          <div style={{ position: "absolute", inset: "-20px 0 20px 0", background: "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 60%)", zIndex: 0 }} />
          
          <div style={{ position: "absolute", top: "10%", right: "10%", width: "80%", height: "70%", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "1rem", background: "rgba(15, 23, 42, 0.6)", padding: "1rem", zIndex: 1, boxShadow: "0 0 30px rgba(59, 130, 246, 0.2)", display: "flex", flexDirection: "column", gap: "1rem", transform: "perspective(1000px) rotateY(-10deg) rotateX(5deg)" }}>
            <div className={styles.flexRow} style={{ justifyContent: "space-between", borderBottom: "1px solid rgba(59, 130, 246, 0.2)", paddingBottom: "0.5rem" }}>
               <div style={{ width: "30%", height: "10px", background: "rgba(59, 130, 246, 0.5)", borderRadius: "5px" }}></div>
               <div className={styles.flexRow} style={{ gap: "0.5rem" }}>
                 <div style={{ width: "10px", height: "10px", background: "rgba(255, 255, 255, 0.2)", borderRadius: "50%" }}></div>
                 <div style={{ width: "10px", height: "10px", background: "rgba(255, 255, 255, 0.2)", borderRadius: "50%" }}></div>
               </div>
            </div>
            <div className={styles.flexRow} style={{ gap: "1rem", flex: 1 }}>
               <div className={styles.flexCol} style={{ gap: "0.5rem", flex: 2 }}>
                  <div style={{ height: "40%", background: "rgba(99, 102, 241, 0.2)", borderRadius: "0.5rem" }}></div>
                  <div style={{ height: "60%", background: "rgba(59, 130, 246, 0.2)", borderRadius: "0.5rem" }}></div>
               </div>
               <div className={styles.flexCol} style={{ gap: "0.5rem", flex: 1 }}>
                  <div style={{ height: "30%", background: "rgba(167, 139, 250, 0.2)", borderRadius: "0.5rem" }}></div>
                  <div style={{ height: "30%", background: "rgba(167, 139, 250, 0.2)", borderRadius: "0.5rem" }}></div>
                  <div style={{ height: "40%", background: "rgba(167, 139, 250, 0.2)", borderRadius: "0.5rem" }}></div>
               </div>
            </div>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
               <BrainCircuit size={100} color="rgba(59, 130, 246, 0.3)" />
            </div>
          </div>

          <img 
            src="/character-thinking.png" 
            alt="Person thinking" 
            style={{ position: "relative", zIndex: 2, height: "110%", objectFit: "contain", transform: "scale(1.2) translateY(20px)" }}
            onError={(e) => { e.currentTarget.src = "/character-official.png" }}
          />

        </div>
      </div>

      {/* FOOTER */}
      <div className={`${styles.flexRow} ${styles.itemsCenter} ${styles.justifyBetween}`} style={{ borderTop: "1px solid rgba(51, 65, 85, 0.5)", paddingTop: "1rem", marginTop: "1rem" }}>
        <div className={styles.flexRow} style={{ alignItems: "center", gap: "1rem" }}>
          <div className={styles.iconBox} style={{ width: "2rem", height: "2rem", background: "rgba(167, 139, 250, 0.1)", borderColor: "rgba(167, 139, 250, 0.3)" }}>
            <Network size={16} className={styles.textPurple} />
          </div>
          <div className={styles.textSm} style={{ color: "#cbd5e1", lineHeight: 1.2 }}>
            No hay tecnología buena ni mala,<br/>sólo la correcta para el problema correcto.
          </div>
        </div>
        <div className={styles.flexRow} style={{ gap: "1.5rem" }}>
          <div className={styles.flexCol} style={{ alignItems: "center", gap: "0.25rem" }}>
            <div className={styles.iconBox} style={{ width: "2rem", height: "2rem", background: "transparent", borderColor: "rgba(255,255,255,0.1)" }}><Check size={14} className={styles.textBlue}/></div>
            <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>ACCESIBLE</span>
          </div>
          <div className={styles.flexCol} style={{ alignItems: "center", gap: "0.25rem" }}>
            <div className={styles.iconBox} style={{ width: "2rem", height: "2rem", background: "transparent", borderColor: "rgba(255,255,255,0.1)" }}><BookOpen size={14} className={styles.textBlue}/></div>
            <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>DOCUMENTADA</span>
          </div>
          <div className={styles.flexCol} style={{ alignItems: "center", gap: "0.25rem" }}>
            <div className={styles.iconBox} style={{ width: "2rem", height: "2rem", background: "transparent", borderColor: "rgba(255,255,255,0.1)" }}><Layers size={14} className={styles.textBlue}/></div>
            <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>COMPATIBLE</span>
          </div>
          <div className={styles.flexCol} style={{ alignItems: "center", gap: "0.25rem" }}>
            <div className={styles.iconBox} style={{ width: "2rem", height: "2rem", background: "transparent", borderColor: "rgba(255,255,255,0.1)" }}><User size={14} className={styles.textBlue}/></div>
            <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>MIS HABILIDADES</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slide2() {
  return (
    <div className={styles.flexCol} style={{ height: "100%" }}>
      <p className={styles.slideSubtitle} style={{ marginBottom: "2rem" }}>
        A veces es difícil elegir la tecnología correcta. Tanta tecnología<br/>que existe, a veces nos podemos perder y confundir un poco.
      </p>
      
      <div className={styles.flexRow} style={{ flex: 1, gap: "2rem" }}>
        {/* LEFT COLUMN */}
        <div className={styles.wHalf} style={{ position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ position: "absolute", top: "0%", right: "10%", transform: "rotate(15deg)" }}><HelpCircle size={80} color="rgba(167, 139, 250, 0.4)" /></div>
          <div style={{ position: "absolute", top: "20%", left: "10%", transform: "rotate(-15deg)" }}><HelpCircle size={50} color="rgba(167, 139, 250, 0.6)" /></div>
          <div style={{ position: "absolute", top: "40%", right: "20%", transform: "rotate(25deg)" }}><HelpCircle size={60} color="rgba(167, 139, 250, 0.5)" /></div>
          <div style={{ position: "absolute", top: "30%", left: "30%", transform: "rotate(-5deg)" }}><HelpCircle size={40} color="rgba(59, 130, 246, 0.4)" /></div>
          <div style={{ position: "absolute", bottom: "30%", right: "5%", transform: "rotate(10deg)" }}><HelpCircle size={70} color="rgba(59, 130, 246, 0.3)" /></div>
          
          <img 
            src="/character-confused.png" 
            alt="Person confused" 
            style={{ position: "relative", zIndex: 2, height: "120%", objectFit: "contain", transform: "translateY(10%)" }}
            onError={(e) => { e.currentTarget.src = "/character-official.png" }}
          />
        </div>
        
        {/* RIGHT COLUMN */}
        <div className={styles.wHalf} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", justifyContent: "center" }}>
          <div className={`${styles.boxCard} ${styles.flexRow} ${styles.itemsCenter}`} style={{ padding: "1rem 1.5rem", gap: "1.5rem", background: "rgba(30, 27, 75, 0.4)", borderColor: "rgba(167, 139, 250, 0.3)" }}>
            <User size={20} className={styles.textPurple} />
            <span className={styles.textBase} style={{ color: "#e2e8f0" }}>¿Qué problema se resuelve?</span>
          </div>
          <div className={`${styles.boxCard} ${styles.flexRow} ${styles.itemsCenter}`} style={{ padding: "1rem 1.5rem", gap: "1.5rem", background: "rgba(30, 27, 75, 0.4)", borderColor: "rgba(167, 139, 250, 0.3)" }}>
            <Users size={20} className={styles.textPurple} />
            <span className={styles.textBase} style={{ color: "#e2e8f0" }}>¿Para quién y cuál es el impacto?</span>
          </div>
          <div className={`${styles.boxCard} ${styles.flexRow} ${styles.itemsCenter}`} style={{ padding: "1rem 1.5rem", gap: "1.5rem", background: "rgba(30, 27, 75, 0.4)", borderColor: "rgba(167, 139, 250, 0.3)" }}>
            <FileText size={20} className={styles.textPurple} />
            <span className={styles.textBase} style={{ color: "#e2e8f0" }}>¿Qué tenemos que mejorar?</span>
          </div>
          <div className={`${styles.boxCard} ${styles.flexRow} ${styles.itemsCenter}`} style={{ padding: "1rem 1.5rem", gap: "1.5rem", background: "rgba(30, 27, 75, 0.4)", borderColor: "rgba(167, 139, 250, 0.3)" }}>
            <Database size={20} className={styles.textPurple} />
            <span className={styles.textBase} style={{ color: "#e2e8f0" }}>¿Qué datos y herramientas se necesitan?</span>
          </div>
          <div className={`${styles.boxCard} ${styles.flexRow} ${styles.itemsCenter}`} style={{ padding: "1rem 1.5rem", gap: "1.5rem", background: "rgba(30, 27, 75, 0.4)", borderColor: "rgba(167, 139, 250, 0.3)" }}>
            <Lock size={20} className={styles.textPurple} />
            <span className={styles.textBase} style={{ color: "#e2e8f0" }}>¿Cuáles son las restricciones?</span>
          </div>
          <div className={`${styles.boxCard} ${styles.flexRow} ${styles.itemsCenter}`} style={{ padding: "1rem 1.5rem", gap: "1.5rem", background: "rgba(30, 27, 75, 0.4)", borderColor: "rgba(167, 139, 250, 0.3)" }}>
            <TargetIcon size={20} className={styles.textPurple} />
            <span className={styles.textBase} style={{ color: "#e2e8f0" }}>¿Cómo mediremos el éxito?</span>
          </div>
        </div>
      </div>

      <div className={`${styles.textCenter} ${styles.fontBold}`} style={{ padding: "1.5rem 0 0.5rem 0", color: "#a78bfa", fontSize: "1.125rem" }}>
        Menos es más. Lo importante es el match correcto.
      </div>
    </div>
  );
}

function Slide3() {
  return (
    <div className={styles.flexCol} style={{ height: "100%", justifyContent: "space-between" }}>
      <div className={styles.flexRow} style={{ flex: 1, gap: "1.5rem", alignItems: "stretch", marginTop: "2rem" }}>
        
        <div className={`${styles.boxCard} ${styles.flex1} ${styles.flexCol}`} style={{ borderTop: "3px solid #60a5fa", position: "relative", paddingTop: "2.5rem" }}>
          <div style={{ position: "absolute", top: "-1.25rem", left: "50%", transform: "translateX(-50%)" }}>
            <div className={styles.circleStep} style={{ background: "#0f172a", width: "2.5rem", height: "2.5rem", fontSize: "1.25rem" }}>1</div>
          </div>
          <div className={`${styles.textCenter} ${styles.fontBold} ${styles.textBlue} ${styles.textLg}`} style={{ marginBottom: "2rem", minHeight: "3.5rem" }}>
            FÁCIL, ACCESIBLE<br/>Y DOCUMENTADA
          </div>
          <ul className={styles.flexCol} style={{ gap: "1.25rem", fontSize: "0.95rem", color: "#cbd5e1" }}>
            <li className={styles.flexRow} style={{ gap: "0.75rem", alignItems: "flex-start" }}><span style={{ color: "#60a5fa" }}>•</span> <span>Documentación extensa</span></li>
            <li className={styles.flexRow} style={{ gap: "0.75rem", alignItems: "flex-start" }}><span style={{ color: "#60a5fa" }}>•</span> <span>Ejemplos existentes</span></li>
            <li className={styles.flexRow} style={{ gap: "0.75rem", alignItems: "flex-start" }}><span style={{ color: "#60a5fa" }}>•</span> <span>Comunidad activa</span></li>
            <li className={styles.flexRow} style={{ gap: "0.75rem", alignItems: "flex-start" }}><span style={{ color: "#60a5fa" }}>•</span> <span>Soporte para mi y<br/>para los agentes de IA</span></li>
          </ul>
          <div className={styles.flexRow} style={{ justifyContent: "center", marginTop: "auto" }}>
            <div className={styles.iconBox} style={{ background: "transparent", borderColor: "rgba(96, 165, 250, 0.3)", width: "3.5rem", height: "3.5rem" }}>
              <BookOpen size={28} className={styles.textBlue} />
            </div>
          </div>
        </div>

        <div className={`${styles.boxCard} ${styles.flex1} ${styles.flexCol}`} style={{ borderTop: "3px solid #22d3ee", position: "relative", paddingTop: "2.5rem" }}>
          <div style={{ position: "absolute", top: "-1.25rem", left: "50%", transform: "translateX(-50%)" }}>
            <div className={styles.circleStep} style={{ background: "#0f172a", borderColor: "#22d3ee", color: "#22d3ee", width: "2.5rem", height: "2.5rem", fontSize: "1.25rem" }}>2</div>
          </div>
          <div className={`${styles.textCenter} ${styles.fontBold} ${styles.textCyan} ${styles.textLg}`} style={{ marginBottom: "2rem", minHeight: "3.5rem" }}>
            ENCAJA CON EL<br/>PRODUCTO Y NEGOCIO
          </div>
          <ul className={styles.flexCol} style={{ gap: "1.25rem", fontSize: "0.95rem", color: "#cbd5e1" }}>
            <li className={styles.flexRow} style={{ gap: "0.75rem", alignItems: "flex-start" }}><span style={{ color: "#22d3ee" }}>•</span> <span>Tipo de servicio</span></li>
            <li className={styles.flexRow} style={{ gap: "0.75rem", alignItems: "flex-start" }}><span style={{ color: "#22d3ee" }}>•</span> <span>Caso de uso real</span></li>
            <li className={styles.flexRow} style={{ gap: "0.75rem", alignItems: "flex-start" }}><span style={{ color: "#22d3ee" }}>•</span> <span>Solucione el problema<br/>de la empresa</span></li>
          </ul>
          <div className={styles.flexRow} style={{ justifyContent: "center", marginTop: "auto" }}>
            <div className={styles.iconBox} style={{ background: "transparent", borderColor: "rgba(34, 211, 238, 0.3)", width: "3.5rem", height: "3.5rem" }}>
              <User size={28} className={styles.textCyan} />
            </div>
          </div>
        </div>

        <div className={`${styles.boxCard} ${styles.flex1} ${styles.flexCol}`} style={{ borderTop: "3px solid #34d399", position: "relative", paddingTop: "2.5rem" }}>
          <div style={{ position: "absolute", top: "-1.25rem", left: "50%", transform: "translateX(-50%)" }}>
            <div className={styles.circleStep} style={{ background: "#0f172a", borderColor: "#34d399", color: "#34d399", width: "2.5rem", height: "2.5rem", fontSize: "1.25rem" }}>3</div>
          </div>
          <div className={`${styles.textCenter} ${styles.fontBold} ${styles.textGreen} ${styles.textLg}`} style={{ marginBottom: "2rem", minHeight: "3.5rem" }}>
            MIS HABILIDADES<br/>+ EL MATCH
          </div>
          <ul className={styles.flexCol} style={{ gap: "1.25rem", fontSize: "0.95rem", color: "#cbd5e1" }}>
            <li className={styles.flexRow} style={{ gap: "0.75rem", alignItems: "flex-start" }}><span style={{ color: "#34d399" }}>•</span> <span>Qué sé hacer</span></li>
            <li className={styles.flexRow} style={{ gap: "0.75rem", alignItems: "flex-start" }}><span style={{ color: "#34d399" }}>•</span> <span>Qué quiero aprender</span></li>
            <li className={styles.flexRow} style={{ gap: "0.75rem", alignItems: "flex-start" }}><span style={{ color: "#34d399" }}>•</span> <span>Match con la tecnología<br/>buscada</span></li>
          </ul>
          <div className={styles.flexRow} style={{ justifyContent: "center", marginTop: "auto" }}>
            <div className={styles.iconBox} style={{ background: "transparent", borderColor: "rgba(52, 211, 153, 0.3)", width: "3.5rem", height: "3.5rem" }}>
              <Target size={28} className={styles.textGreen} />
            </div>
          </div>
        </div>

      </div>

      <div className={`${styles.flexRow} ${styles.itemsCenter} ${styles.justifyCenter} ${styles.gap4}`} style={{ marginTop: "2.5rem", padding: "1.5rem", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "0.5rem", background: "rgba(15, 23, 42, 0.8)" }}>
        <span className={styles.textBlue} style={{ fontSize: "1.125rem" }}>Habilidades</span>
        <span className={styles.textMuted} style={{ fontSize: "1.25rem", fontWeight: "bold" }}>+</span>
        <span className={styles.textBlue} style={{ fontSize: "1.125rem" }}>Necesidad del negocio</span>
        <span className={styles.textMuted} style={{ fontSize: "1.25rem", fontWeight: "bold" }}>+</span>
        <span className={styles.textBlue} style={{ fontSize: "1.125rem" }}>Tecnología</span>
        <span className={styles.textMuted} style={{ fontSize: "1.25rem", fontWeight: "bold" }}>=</span>
        <span className={`${styles.textBlue} ${styles.fontBold}`} style={{ fontSize: "1.25rem" }}>Éxito</span>
        <Target size={24} className={styles.textBlue} />
      </div>
    </div>
  );
}

function Slide4() {
  return (
    <div className={styles.flexRow} style={{ height: "100%", alignItems: "center", gap: "2rem" }}>
      <div className={styles.wHalf} style={{ display: "flex", justifyContent: "center", position: "relative" }}>
        <div style={{ position: "relative", width: "400px", height: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
           <div style={{ position: "absolute", inset: "0", borderRadius: "50%", border: "2px dashed rgba(139, 92, 246, 0.4)", animation: "spin 20s linear infinite" }} />
           <div style={{ position: "absolute", inset: "30px", borderRadius: "50%", border: "1px solid rgba(139, 92, 246, 0.2)" }} />
           <div style={{ position: "absolute", inset: "60px", borderRadius: "50%", border: "3px solid rgba(139, 92, 246, 0.5)", boxShadow: "0 0 30px rgba(139, 92, 246, 0.3), inset 0 0 30px rgba(139, 92, 246, 0.3)" }} />
           <HelpCircle size={180} color="#a78bfa" style={{ filter: "drop-shadow(0 0 30px rgba(139, 92, 246, 0.8))" }} />
           
           <div style={{ position: "absolute", top: "15%", right: "15%", width: "15px", height: "15px", background: "#38bdf8", borderRadius: "50%", boxShadow: "0 0 15px #38bdf8" }} />
           <div style={{ position: "absolute", bottom: "25%", left: "10%", width: "20px", height: "20px", background: "#a78bfa", borderRadius: "50%", boxShadow: "0 0 20px #a78bfa" }} />
        </div>
      </div>
      
      <div className={styles.wHalf} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div className={`${styles.boxCard} ${styles.flexRow} ${styles.itemsCenter}`} style={{ padding: "1.25rem", gap: "1.5rem", background: "transparent", border: "1px solid rgba(51, 65, 85, 0.8)" }}>
          <Search size={28} className={styles.textPurple} />
          <span className={styles.textLg} style={{ color: "#e2e8f0" }}>¿Qué problema se resuelve?</span>
        </div>
        <div className={`${styles.boxCard} ${styles.flexRow} ${styles.itemsCenter}`} style={{ padding: "1.25rem", gap: "1.5rem", background: "transparent", border: "1px solid rgba(51, 65, 85, 0.8)" }}>
          <Users size={28} className={styles.textPurple} />
          <span className={styles.textLg} style={{ color: "#e2e8f0" }}>¿Para quién y cuál es el impacto?</span>
        </div>
        <div className={`${styles.boxCard} ${styles.flexRow} ${styles.itemsCenter}`} style={{ padding: "1.25rem", gap: "1.5rem", background: "transparent", border: "1px solid rgba(51, 65, 85, 0.8)" }}>
          <LineChart size={28} className={styles.textPurple} />
          <span className={styles.textLg} style={{ color: "#e2e8f0" }}>¿Qué resultados se esperan?</span>
        </div>
        <div className={`${styles.boxCard} ${styles.flexRow} ${styles.itemsCenter}`} style={{ padding: "1.25rem", gap: "1.5rem", background: "transparent", border: "1px solid rgba(51, 65, 85, 0.8)" }}>
          <Database size={28} className={styles.textPurple} />
          <span className={styles.textLg} style={{ color: "#e2e8f0" }}>¿Qué datos y herramientas se necesitan?</span>
        </div>
        <div className={`${styles.boxCard} ${styles.flexRow} ${styles.itemsCenter}`} style={{ padding: "1.25rem", gap: "1.5rem", background: "transparent", border: "1px solid rgba(51, 65, 85, 0.8)" }}>
          <Lock size={28} className={styles.textPurple} />
          <span className={styles.textLg} style={{ color: "#e2e8f0" }}>¿Cuáles son las restricciones?</span>
        </div>
        <div className={`${styles.boxCard} ${styles.flexRow} ${styles.itemsCenter}`} style={{ padding: "1.25rem", gap: "1.5rem", background: "transparent", border: "1px solid rgba(51, 65, 85, 0.8)" }}>
          <TargetIcon size={28} className={styles.textPurple} />
          <span className={styles.textLg} style={{ color: "#e2e8f0" }}>¿Cómo mediremos el éxito?</span>
        </div>
      </div>
    </div>
  );
}

function Slide5() {
  return (
    <div className={styles.flexCol} style={{ height: "100%", justifyContent: "space-between" }}>
      <div className={styles.flexRow} style={{ flex: 1, gap: "3rem", marginTop: "2rem" }}>
        
        {/* TEXT COLUMN */}
        <div className={styles.wHalf} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <p className={styles.textLg} style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
            Los equipos de operaciones necesitan pasar de <span style={{ color: "#f8fafc" }}>&quot;tengo logs y métricas en la nube&quot;</span> a <span style={{ color: "#f8fafc" }}>&quot;entiendo qué falló, por qué importa y qué comunicar al negocio&quot;</span>, sin ejecutar siempre un pipeline monolítico de varios minutos ni depender de un único LLM que retenga todo el contexto de GCP, proyectos, servicios e incidentes.
          </p>
          <p className={styles.textLg} style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
            Además del diagnóstico técnico, se busca medir resultados de los proyectos en su relación con clientes y proponer alternativas de solución que mejoren esos resultados.
          </p>
        </div>

        {/* DIAGRAM COLUMN */}
        <div className={styles.wHalf} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className={styles.flexRow} style={{ alignItems: "center", gap: "1.5rem", width: "100%", justifyContent: "space-between" }}>
            
            <div className={styles.flexCol} style={{ alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "110px", height: "110px", borderRadius: "50%", border: "2px solid #3b82f6", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 20px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)" }}>
                <Cloud size={50} color="#60a5fa" />
              </div>
              <span className={`${styles.textSm} ${styles.fontBold} ${styles.textCenter}`} style={{ color: "#cbd5e1" }}>LOGS<br/>Y MÉTRICAS</span>
            </div>
            
            <div style={{ position: "relative" }}>
               <div style={{ width: "40px", height: "2px", background: "rgba(148, 163, 184, 0.5)" }}></div>
               <div style={{ position: "absolute", right: "-5px", top: "-4px", width: "10px", height: "10px", borderTop: "2px solid rgba(148, 163, 184, 0.5)", borderRight: "2px solid rgba(148, 163, 184, 0.5)", transform: "rotate(45deg)" }}></div>
            </div>
            
            <div className={styles.flexCol} style={{ alignItems: "center", gap: "0" }}>
              <div style={{ width: "160px", height: "160px", borderRadius: "50%", border: "2px dashed #a78bfa", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                 <div style={{ position: "absolute", inset: "5px", borderRadius: "50%", background: "radial-gradient(circle at 50% 50%, rgba(167, 139, 250, 0.2) 0%, transparent 70%)" }}></div>
                 <img 
                   src="/character-insight.png" 
                   alt="Person with insight" 
                   style={{ width: "130%", height: "130%", objectFit: "contain", transform: "translateY(10px) translateX(-5px)", zIndex: 2 }}
                   onError={(e) => { e.currentTarget.src = "/character-official.png" }}
                 />
              </div>
            </div>
            
            <div style={{ position: "relative" }}>
               <div style={{ width: "40px", height: "2px", background: "rgba(148, 163, 184, 0.5)" }}></div>
               <div style={{ position: "absolute", right: "-5px", top: "-4px", width: "10px", height: "10px", borderTop: "2px solid rgba(148, 163, 184, 0.5)", borderRight: "2px solid rgba(148, 163, 184, 0.5)", transform: "rotate(45deg)" }}></div>
            </div>
            
            <div className={styles.flexCol} style={{ alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "110px", height: "110px", borderRadius: "50%", border: "2px solid #34d399", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 20px rgba(52, 211, 153, 0.3), 0 0 20px rgba(52, 211, 153, 0.2)" }}>
                <CheckCircle2 size={50} color="#34d399" />
              </div>
              <span className={`${styles.textSm} ${styles.fontBold} ${styles.textCenter}`} style={{ color: "#cbd5e1" }}>ENTENDIMIENTO<br/>Y ACCIÓN</span>
            </div>
          </div>
        </div>

      </div>
      
      <div className={`${styles.textCenter} ${styles.textPurple} ${styles.fontBold} ${styles.textLg}`} style={{ padding: "1.5rem 0", borderTop: "1px solid rgba(51, 65, 85, 0.5)" }}>
        Del ruido de datos a decisiones que generan impacto.
      </div>
    </div>
  );
}

function Slide6() {
  return (
    <div className={styles.flexCol} style={{ height: "100%", justifyContent: "space-between" }}>
      <div className={styles.flexRow} style={{ flex: 1, gap: "1rem", alignItems: "stretch", marginTop: "2rem" }}>
        
        {[
          { n: "1", i: Activity, t: "Detección\nde incidentes\n(telemetría)", d: "Empresa ->\nProyecto ->\nServicios" },
          { n: "2", i: Search, t: "Análisis de\ncausa raíz", d: "Por cada\nincidente" },
          { n: "3", i: FileText, t: "Reporte ejecutivo\nPRIME", d: "KPIs +\nNarrativa" },
          { n: "4", i: Lightbulb, t: "Alternativas\nde solución", d: "Mejorar resultados\nhacia clientes" },
          { n: "5", i: MessageSquare, t: "Chat\ninteligente", d: "Por pasos o flujo\ncompleto con\nconfirmaciones\nhumanas" }
        ].map((item, idx) => (
          <div key={idx} className={`${styles.boxCard} ${styles.flex1} ${styles.flexCol}`} style={{ alignItems: "center", gap: "1.5rem", textAlign: "center", borderColor: "rgba(59, 130, 246, 0.3)", padding: "2.5rem 1rem", background: "transparent" }}>
            <div className={styles.circleStep} style={{ background: "transparent", borderColor: "#60a5fa", color: "#60a5fa", width: "2.5rem", height: "2.5rem", fontSize: "1.25rem" }}>{item.n}</div>
            <div className={`${styles.fontBold} ${styles.textBase}`} style={{ color: "#f8fafc", minHeight: "4rem", whiteSpace: "pre-line", lineHeight: 1.4 }}>{item.t}</div>
            <item.i size={50} style={{ color: "#cbd5e1" }} />
            <div className={styles.textSm} style={{ color: "#94a3b8", whiteSpace: "pre-line", marginTop: "auto", lineHeight: 1.4 }}>{item.d}</div>
          </div>
        ))}

      </div>

      <div className={`${styles.flexRow} ${styles.justifyCenter} ${styles.itemsCenter} ${styles.gap4}`} style={{ marginTop: "2.5rem", padding: "1.5rem", borderTop: "1px solid rgba(51, 65, 85, 0.5)" }}>
        <span className={styles.textBase} style={{ color: "#cbd5e1" }}>Información</span> 
        <ArrowRight size={16} color="#64748b" /> 
        <span className={styles.textBase} style={{ color: "#cbd5e1" }}>Entendimiento</span> 
        <ArrowRight size={16} color="#64748b" /> 
        <span className={styles.textBase} style={{ color: "#cbd5e1" }}>Acción</span> 
        <ArrowRight size={16} color="#64748b" /> 
        <span className={`${styles.textBase} ${styles.textBlue} ${styles.fontBold}`}>Mejores resultados</span>
        <BarChart3 size={20} className={styles.textBlue} />
      </div>
    </div>
  );
}

function Slide7() {
  return (
    <div className={styles.flexCol} style={{ height: "100%" }}>
      <p className={styles.slideSubtitle} style={{ marginBottom: "2rem" }}>La arquitectura separa tres capas para máxima efectividad.</p>
      
      <div className={styles.flexCol} style={{ gap: "1.5rem", flex: 1, padding: "0" }}>
        
        <div className={`${styles.boxCard} ${styles.flexRow} ${styles.itemsCenter}`} style={{ gap: "2rem", padding: "2rem 3rem", background: "transparent", border: "1px solid rgba(51, 65, 85, 0.8)" }}>
          <div className={styles.iconBox} style={{ width: "4rem", height: "4rem", background: "rgba(139, 92, 246, 0.1)", borderColor: "rgba(139, 92, 246, 0.3)" }}>
            <Network size={32} className={styles.textPurple} />
          </div>
          <div className={styles.wThird}>
            <div className={`${styles.textLg} ${styles.fontBold} ${styles.textPurple}`}>ORQUESTACIÓN</div>
            <div className={styles.textSm} style={{ color: "#cbd5e1", marginTop: "0.5rem", lineHeight: 1.4 }}>Quién ejecuta qué<br/>y en qué orden</div>
          </div>
          <div className={styles.flex1} style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.6 }}>
            - Google ADK<br/>
            &nbsp;&nbsp;aiops_coordinator<br/>
            &nbsp;&nbsp;+ subagentes
          </div>
        </div>

        <div className={`${styles.boxCard} ${styles.flexRow} ${styles.itemsCenter}`} style={{ gap: "2rem", padding: "2rem 3rem", background: "transparent", border: "1px solid rgba(51, 65, 85, 0.8)" }}>
          <div className={styles.iconBox} style={{ width: "4rem", height: "4rem", background: "rgba(59, 130, 246, 0.1)", borderColor: "rgba(59, 130, 246, 0.3)" }}>
            <Target size={32} className={styles.textBlue} />
          </div>
          <div className={styles.wThird}>
            <div className={`${styles.textLg} ${styles.fontBold} ${styles.textBlue}`}>TRABAJO DE DOMINIO</div>
            <div className={styles.textSm} style={{ color: "#cbd5e1", marginTop: "0.5rem", lineHeight: 1.4 }}>Reglas de negocio, KPIs,<br/>detección</div>
          </div>
          <div className={styles.flex1} style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.6 }}>
            Use cases TypeScript<br/>
            + agentes ADK acotados
          </div>
        </div>

        <div className={`${styles.boxCard} ${styles.flexRow} ${styles.itemsCenter}`} style={{ gap: "2rem", padding: "2rem 3rem", background: "transparent", border: "1px solid rgba(51, 65, 85, 0.8)" }}>
          <div className={styles.iconBox} style={{ width: "4rem", height: "4rem", background: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.3)" }}>
            <Users size={32} className={styles.textGreen} />
          </div>
          <div className={styles.wThird}>
            <div className={`${styles.textLg} ${styles.fontBold} ${styles.textGreen}`}>EXPERIENCIA</div>
            <div className={styles.textSm} style={{ color: "#cbd5e1", marginTop: "0.5rem", lineHeight: 1.4 }}>Chat, estado compartido,<br/>HITL, UI generativa</div>
          </div>
          <div className={styles.flex1} style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.6 }}>
            CopilotKit<br/>
            (React + runtime HTTP)
          </div>
        </div>
      </div>

      <div className={`${styles.flexRow} ${styles.itemsCenter} ${styles.justifyCenter} ${styles.gap2}`} style={{ padding: "1.5rem 0 0 0", marginTop: "1rem" }}>
        <span className={styles.textBase} style={{ color: "#cbd5e1" }}>Un rol claro para cada capa. Menos magia, más control.</span>
        <ShieldCheck size={20} className={styles.textGreen} />
      </div>
    </div>
  );
}

function Slide8() {
  return (
    <div className={styles.flexRow} style={{ height: "100%", gap: "4rem", alignItems: "center" }}>
      
      {/* LEFT COLUMN */}
      <div className={styles.wHalf} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div className={styles.flexCol} style={{ gap: "1.5rem" }}>
          {[
            "Workers separados invocables bajo demanda",
            "Store en memoria por runId",
            "Cache en React + useAgentContext (estado visible por turno).",
            "Si el reporte ya está en caché, vamos directo al reporter.",
            "Los subagentes NO se comunican entre sí. Comparten store por runId."
          ].map((t, i) => (
            <div key={i} className={styles.flexRow} style={{ alignItems: "flex-start", gap: "1rem" }}>
              <div className={styles.iconBox} style={{ background: "transparent", borderColor: "rgba(52, 211, 153, 0.3)", width: "1.5rem", height: "1.5rem" }}>
                 <Check size={14} className={styles.textGreen} />
              </div>
              <span className={styles.textBase} style={{ color: "#e2e8f0", lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>

        <div className={styles.boxCard} style={{ borderColor: "rgba(59, 130, 246, 0.4)", background: "transparent", textAlign: "center", color: "#60a5fa", fontWeight: "bold", fontSize: "1.125rem", marginTop: "1rem", padding: "1rem" }}>
          Agilidad + Control + Escalabilidad
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className={styles.wHalf} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* Top Node */}
        <div className={styles.boxCard} style={{ borderColor: "rgba(167, 139, 250, 0.4)", background: "rgba(30, 27, 75, 0.6)", width: "70%", textAlign: "center", marginBottom: "3rem", position: "relative", zIndex: 2 }}>
          <div className={styles.fontBold} style={{ color: "#e2e8f0", fontSize: "1.125rem" }}>aiops_coordinator</div>
          <div className={styles.textSm} style={{ color: "#a78bfa", marginTop: "0.25rem" }}>(ADK)</div>
          
          {/* Connecting Lines */}
          <div style={{ position: "absolute", bottom: "-3rem", left: "50%", width: "2px", height: "3rem", background: "rgba(59, 130, 246, 0.4)", zIndex: -1 }} />
          <div style={{ position: "absolute", bottom: "-3rem", left: "16.66%", width: "66.66%", height: "2px", background: "rgba(59, 130, 246, 0.4)", zIndex: -1 }} />
          <div style={{ position: "absolute", bottom: "-3rem", left: "16.66%", width: "2px", height: "3rem", background: "rgba(59, 130, 246, 0.4)", zIndex: -1 }} />
          <div style={{ position: "absolute", bottom: "-3rem", right: "16.66%", width: "2px", height: "3rem", background: "rgba(59, 130, 246, 0.4)", zIndex: -1 }} />
        </div>
        
        {/* Bottom Nodes */}
        <div className={styles.flexRow} style={{ gap: "1rem", width: "100%", zIndex: 2 }}>
          {[
            { id: "telemetry_worker", u: "RunTelemetry\nUseCase" },
            { id: "analyst_worker", u: "RunAnalyst\nUseCase\n+ LlmAgent" },
            { id: "reporter_worker", u: "RunReporter\nUseCase\n+ LlmAgent" }
          ].map(w => (
            <div key={w.id} className={`${styles.boxCard} ${styles.flex1} ${styles.flexCol}`} style={{ alignItems: "center", textAlign: "center", gap: "1rem", padding: "1.5rem 0.5rem", borderColor: "rgba(59, 130, 246, 0.4)", background: "rgba(15, 23, 42, 0.6)" }}>
              <div style={{ color: "#60a5fa", fontWeight: "bold", fontSize: "0.85rem" }}>{w.id}</div>
              
              {/* Robot Image or Icon Placeholder */}
              <div style={{ height: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img 
                  src="/robot-worker.png" 
                  alt="Worker" 
                  style={{ height: "100%", objectFit: "contain" }}
                  onError={(e) => { 
                    e.currentTarget.style.display = 'none'; 
                    (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex'; 
                  }}
                />
                <div style={{ display: "none", width: "40px", height: "40px", background: "rgba(59, 130, 246, 0.2)", borderRadius: "50%", alignItems: "center", justifyContent: "center" }}>
                  <Cpu size={24} className={styles.textBlue} />
                </div>
              </div>

              <div style={{ color: "#cbd5e1", whiteSpace: "pre-line", fontSize: "0.85rem", lineHeight: 1.4 }}>{w.u}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Slide9() {
  return (
    <div className={styles.flexCol} style={{ height: "100%", justifyContent: "space-between" }}>
      <div className={styles.boxCard} style={{ padding: "0", overflow: "hidden", marginTop: "2rem", border: "1px solid rgba(51, 65, 85, 0.8)", background: "transparent" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th className={styles.tableHeader} style={{ padding: "1.5rem 2rem", width: "20%" }}></th>
              <th className={styles.tableHeader} style={{ padding: "1.5rem 2rem", color: "#f87171", width: "40%" }}>
                <div className={styles.flexRow} style={{ alignItems: "center", gap: "0.75rem", fontSize: "0.85rem" }}>
                  <X size={16} /> Un solo LLM / Un solo framework
                </div>
              </th>
              <th className={styles.tableHeader} style={{ padding: "1.5rem 2rem", color: "#34d399", width: "40%" }}>
                <div className={styles.flexRow} style={{ alignItems: "center", gap: "0.75rem", fontSize: "0.85rem" }}>
                  <CheckCircle2 size={16} /> ADK Orchestrator + CopilotKit UI
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={`${styles.tableCell} ${styles.tableCellBold}`} style={{ paddingLeft: "2rem" }}>Routing y control</td>
              <td className={styles.tableCell} style={{ paddingLeft: "2rem", color: "#cbd5e1" }}>Riesgo de alucinación<br/>y mezcla de responsabilidades</td>
              <td className={styles.tableCell} style={{ paddingLeft: "2rem", color: "#cbd5e1" }}>Roles claros y herramientas<br/>por subagente</td>
            </tr>
            <tr>
              <td className={`${styles.tableCell} ${styles.tableCellBold}`} style={{ paddingLeft: "2rem" }}>Contexto largo</td>
              <td className={styles.tableCell} style={{ paddingLeft: "2rem", color: "#cbd5e1" }}>Pérdida de contexto<br/>en conversaciones largas</td>
              <td className={styles.tableCell} style={{ paddingLeft: "2rem", color: "#cbd5e1" }}>Estado compartido por runId<br/>y contexto visible</td>
            </tr>
            <tr>
              <td className={`${styles.tableCell} ${styles.tableCellBold}`} style={{ paddingLeft: "2rem" }}>UX</td>
              <td className={styles.tableCell} style={{ paddingLeft: "2rem", color: "#cbd5e1" }}>Espera larga sin feedback</td>
              <td className={styles.tableCell} style={{ paddingLeft: "2rem", color: "#cbd5e1" }}>Ejecución incremental<br/>con feedback rápido</td>
            </tr>
            <tr>
              <td className={`${styles.tableCell} ${styles.tableCellBold}`} style={{ paddingLeft: "2rem" }}>Mantenibilidad</td>
              <td className={styles.tableCell} style={{ paddingLeft: "2rem", color: "#cbd5e1" }}>Todo en un mega prompt</td>
              <td className={styles.tableCell} style={{ paddingLeft: "2rem", color: "#cbd5e1" }}>Responsabilidades separadas<br/>y testeables</td>
            </tr>
            <tr>
              <td className={`${styles.tableCell} ${styles.tableCellBold}`} style={{ paddingLeft: "2rem", borderBottom: "none" }}>Confiabilidad</td>
              <td className={styles.tableCell} style={{ paddingLeft: "2rem", color: "#cbd5e1", borderBottom: "none" }}>Mayor riesgo</td>
              <td className={styles.tableCell} style={{ paddingLeft: "2rem", color: "#cbd5e1", borderBottom: "none" }}>Más robusto y predecible</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={`${styles.textCenter} ${styles.textLg}`} style={{ padding: "1.5rem 0", borderTop: "1px solid rgba(51, 65, 85, 0.5)", color: "#cbd5e1" }}>
        <span className={styles.fontBold} style={{ color: "#a78bfa" }}>Decisión:</span> control, claridad y experiencia superior.
      </div>
    </div>
  );
}

function Slide10() {
  return (
    <div className={styles.flexCol} style={{ height: "100%", justifyContent: "space-between" }}>
      <div className={styles.flexCol} style={{ gap: "0", flex: 1, padding: "1rem 4rem" }}>
        {[
          { i: Database, t: "Store en memoria", d: "Simplicidad para MVP: se pierde al reiniciar servidor -> requiere re-ejecutar telemetría" },
          { i: Layers, t: "Dos fuentes de contexto", d: "ADK session + JSON en Copilot; requiere mantener runId alineado" },
          { i: TargetIcon, t: "Pipeline no bloqueado", d: "Reporter puede correr con datos parciales; mayor flexibilidad" },
          { i: Users, t: "Sin agente remoto / MCP", d: "Menos operación, más acoplamiento" },
          { i: Search, t: "HITL en cliente", d: "Confirmaciones humanas en React; coordinador confía en contexto + reglas" },
          { i: Network, t: "Más piezas que mantener", d: "ADK + CopilotKit + Bridge: trade-off por control y UX" }
        ].map((item, idx) => (
          <div key={idx} className={styles.flexRow} style={{ alignItems: "center", gap: "2rem", borderBottom: idx !== 5 ? "1px solid rgba(51, 65, 85, 0.3)" : "none", padding: "1.25rem 0" }}>
            <div className={styles.iconBox} style={{ background: "transparent", border: "1px solid rgba(51, 65, 85, 0.5)", width: "3rem", height: "3rem" }}>
              <item.i size={20} className={styles.textBlue} />
            </div>
            <div style={{ width: "280px", color: "#e2e8f0", fontWeight: "600", fontSize: "1rem" }}>{item.t}</div>
            <div style={{ flex: 1, color: "#94a3b8", fontSize: "0.95rem" }}>{item.d}</div>
          </div>
        ))}
      </div>

      <div className={`${styles.textCenter} ${styles.textLg}`} style={{ padding: "1.5rem 0", borderTop: "1px solid rgba(51, 65, 85, 0.5)", color: "#cbd5e1" }}>
        Trade-offs conscientes para entregar valor real desde el día 1.
      </div>
    </div>
  );
}

function Slide11() {
  return (
    <div className={styles.flexCol} style={{ height: "100%", gap: "1.5rem" }}>
      <p className={styles.slideSubtitle}>La mejor combinación para la experiencia conversacional.</p>
      
      <div className={styles.flexRow} style={{ flex: 1, gap: "3rem" }}>
        
        {/* LEFT COLUMN */}
        <div className={styles.wHalf} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", alignContent: "start" }}>
          {[
            { i: MessageSquare, t: "Componentes de chat listos\ny stateless-friendly" },
            { i: Layout, t: "UI generativa y actividad\nen chat (AG-UI)" },
            { i: Network, t: "Protocolo agente <-> UI\n(AG-UI)" },
            { i: Briefcase, t: "Integración con agente\nexterno (ADK) sencilla" },
            { i: ShieldCheck, t: "Human-in-the-loop integrado\n(useHumanInTheLoop)" },
            { i: Layers, t: "Ecosistema en crecimiento\ny adaptable" }
          ].map((item, idx) => (
            <div key={idx} className={styles.flexRow} style={{ alignItems: "flex-start", gap: "1rem" }}>
              <div className={styles.iconBox} style={{ background: "transparent", border: "1px solid rgba(167, 139, 250, 0.3)", width: "2.5rem", height: "2.5rem" }}>
                <item.i size={16} className={styles.textPurple} />
              </div>
              <span className={styles.textSm} style={{ color: "#cbd5e1", whiteSpace: "pre-line", paddingTop: "0.5rem", lineHeight: 1.4 }}>{item.t}</span>
            </div>
          ))}

          <div style={{ gridColumn: "1 / -1", marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className={styles.boxCard} style={{ borderColor: "rgba(59, 130, 246, 0.3)", background: "transparent", padding: "1.25rem" }}>
              <div className={styles.fontBold} style={{ marginBottom: "1rem", color: "#e2e8f0", fontSize: "0.95rem" }}>Se comparó con Vercel AI SDK solo:</div>
              <ul className={styles.flexCol} style={{ gap: "0.75rem", fontSize: "0.85rem", color: "#94a3b8" }}>
                <li className={styles.flexRow} style={{ gap: "0.5rem" }}><Plus size={16} className={styles.textGreen} style={{ flexShrink: 0 }}/> Excelente para streaming y UI custom</li>
                <li className={styles.flexRow} style={{ gap: "0.5rem" }}><X size={16} className={styles.textRed} style={{ flexShrink: 0 }}/> Más manual para chat, HITL y UI generativa</li>
                <li className={styles.flexRow} style={{ gap: "0.5rem" }}><X size={16} className={styles.textRed} style={{ flexShrink: 0 }}/> Más puente propio para agente externo (ADK)</li>
              </ul>
            </div>
            
            <div className={styles.boxCard} style={{ borderColor: "rgba(167, 139, 250, 0.3)", background: "transparent", padding: "1.25rem" }}>
              <div className={styles.fontBold} style={{ marginBottom: "1rem", color: "#a78bfa", fontSize: "0.95rem" }}>Estrategia elegida:<br/>CopilotKit (UI + runtime AG-UI) + Next.js (unificado)</div>
              <ul className={styles.flexCol} style={{ gap: "0.75rem", fontSize: "0.85rem", color: "#cbd5e1" }}>
                <li className={styles.flexRow} style={{ gap: "0.5rem", alignItems: "flex-start" }}><div className={styles.iconBox} style={{ width: "1.25rem", height: "1.25rem", background: "transparent", borderColor: "rgba(52, 211, 153, 0.3)" }}><Check size={10} className={styles.textGreen}/></div> Valor principal: conversación + aprobaciones + tarjetas de pipeline</li>
                <li className={styles.flexRow} style={{ gap: "0.5rem", alignItems: "flex-start" }}><div className={styles.iconBox} style={{ width: "1.25rem", height: "1.25rem", background: "transparent", borderColor: "rgba(52, 211, 153, 0.3)" }}><Check size={10} className={styles.textGreen}/></div> ADK como cerebro (backend TypeScript)</li>
                <li className={styles.flexRow} style={{ gap: "0.5rem", alignItems: "flex-start" }}><div className={styles.iconBox} style={{ width: "1.25rem", height: "1.25rem", background: "transparent", borderColor: "rgba(52, 211, 153, 0.3)" }}><Check size={10} className={styles.textGreen}/></div> Menos fricción operativa, todo en un solo repo y despliegue</li>
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.wHalf} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          <div style={{ height: "300px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
             {/* Abstract Mock Dashboard in background */}
             <div style={{ position: "absolute", top: "20%", left: "10%", width: "70%", height: "60%", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "1rem", background: "rgba(15, 23, 42, 0.4)", padding: "1rem", zIndex: 1, boxShadow: "0 0 30px rgba(59, 130, 246, 0.1)", transform: "perspective(1000px) rotateY(10deg)" }}>
               <div style={{ width: "30%", height: "8px", background: "rgba(59, 130, 246, 0.3)", borderRadius: "4px", marginBottom: "1rem" }}></div>
               <div className={styles.flexRow} style={{ gap: "1rem", height: "100px" }}>
                  <div style={{ flex: 2, background: "rgba(167, 139, 250, 0.1)", borderRadius: "0.5rem" }}></div>
                  <div style={{ flex: 1, background: "rgba(59, 130, 246, 0.1)", borderRadius: "0.5rem" }}></div>
               </div>
             </div>

             <img 
               src="/robot-copilot.png" 
               alt="Copilot Robot" 
               style={{ position: "absolute", bottom: "0", right: "10%", zIndex: 2, height: "120%", objectFit: "contain", filter: "drop-shadow(0 0 20px rgba(167, 139, 250, 0.3))" }}
               onError={(e) => { 
                  e.currentTarget.style.display = 'none'; 
                  (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex'; 
               }}
             />
             <div style={{ display: "none", position: "absolute", bottom: "10%", right: "10%", zIndex: 2 }}>
                <Monitor size={150} color="#60a5fa" />
             </div>
          </div>

          <div className={styles.boxCard} style={{ background: "transparent", border: "1px solid rgba(51, 65, 85, 0.5)" }}>
            <div className={`${styles.fontBold} ${styles.textBase}`} style={{ marginBottom: "1.5rem", color: "#e2e8f0" }}>Resultados esperados</div>
            <div className={styles.flexRow} style={{ justifyContent: "space-between" }}>
              <div className={styles.flexCol} style={{ alignItems: "center", gap: "1rem", textAlign: "center", flex: 1 }}>
                <Rocket size={24} className={styles.textPurple} />
                <span className={styles.textSm} style={{ color: "#cbd5e1" }}>Menos fricción<br/>para el usuario</span>
              </div>
              <div className={styles.flexCol} style={{ alignItems: "center", gap: "1rem", textAlign: "center", flex: 1 }}>
                <ShieldCheck size={24} className={styles.textBlue} />
                <span className={styles.textSm} style={{ color: "#cbd5e1" }}>Más control y<br/>confiabilidad</span>
              </div>
              <div className={styles.flexCol} style={{ alignItems: "center", gap: "1rem", textAlign: "center", flex: 1 }}>
                <BarChart3 size={24} className={styles.textGreen} />
                <span className={styles.textSm} style={{ color: "#cbd5e1" }}>Entregas más rápidas<br/>y medibles</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className={`${styles.textCenter} ${styles.textBase}`} style={{ paddingTop: "1rem", borderTop: "1px solid rgba(51, 65, 85, 0.5)", color: "#cbd5e1", marginTop: "auto" }}>
        Conversaciones inteligentes. Decisiones mejores. Resultados reales. <BarChart3 size={18} className={styles.textPurple} style={{ display: "inline", verticalAlign: "middle", marginLeft: "0.5rem" }} />
      </div>
    </div>
  );
}

function Slide12() {
  return (
    <div className={styles.flexCol} style={{ height: "100%", justifyContent: "space-between" }}>
      <p className={styles.slideSubtitle} style={{ marginBottom: "2rem" }}>
        Potenciando el desarrollo con herramientas y flujos de trabajo de nueva generación.
      </p>

      <div className={styles.flexCol} style={{ gap: "1.5rem", flex: 1, padding: "0 2rem" }}>
        
        <div className={styles.flexRow} style={{ gap: "1.5rem", flex: 1 }}>
          {/* Card 1 */}
          <div className={`${styles.boxCard} ${styles.flex1} ${styles.flexCol}`} style={{ gap: "1.5rem", background: "transparent", border: "1px solid rgba(59, 130, 246, 0.5)", padding: "2rem" }}>
            <div className={styles.iconBox} style={{ width: "3.5rem", height: "3.5rem", background: "rgba(59, 130, 246, 0.1)", borderColor: "rgba(59, 130, 246, 0.3)" }}>
              <Code size={28} className={styles.textBlue} />
            </div>
            <div>
              <div className={`${styles.textLg} ${styles.fontBold} ${styles.textBlue}`}>Codex + Plugins</div>
              <div className={styles.textSm} style={{ color: "#cbd5e1", marginTop: "0.75rem", lineHeight: 1.5 }}>
                Base del desarrollo asistido por IA.<br/>
                Integración continua con el entorno de trabajo para generación de código y refactorización ágil.
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className={`${styles.boxCard} ${styles.flex1} ${styles.flexCol}`} style={{ gap: "1.5rem", background: "transparent", border: "1px solid rgba(167, 139, 250, 0.5)", padding: "2rem" }}>
            <div className={styles.iconBox} style={{ width: "3.5rem", height: "3.5rem", background: "rgba(167, 139, 250, 0.1)", borderColor: "rgba(167, 139, 250, 0.3)" }}>
              <Network size={28} className={styles.textPurple} />
            </div>
            <div>
              <div className={`${styles.textLg} ${styles.fontBold} ${styles.textPurple}`}>Integraciones MCP</div>
              <div className={styles.textSm} style={{ color: "#cbd5e1", marginTop: "0.75rem", lineHeight: 1.5 }}>
                <span style={{ color: "#e2e8f0", fontWeight: "bold" }}>CopilotKit MCP & Context7</span><br/>
                Proveen contexto enriquecido, orquestación avanzada y conexión fluida con herramientas del sistema.
              </div>
            </div>
          </div>
        </div>

        <div className={styles.flexRow} style={{ gap: "1.5rem", flex: 1 }}>
          {/* Card 3 */}
          <div className={`${styles.boxCard} ${styles.flex1} ${styles.flexCol}`} style={{ gap: "1.5rem", background: "transparent", border: "1px solid rgba(16, 185, 129, 0.5)", padding: "2rem" }}>
            <div className={styles.iconBox} style={{ width: "3.5rem", height: "3.5rem", background: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.3)" }}>
              <Palette size={28} className={styles.textGreen} />
            </div>
            <div>
              <div className={`${styles.textLg} ${styles.fontBold} ${styles.textGreen}`}>Diseño e Inspiración</div>
              <div className={styles.textSm} style={{ color: "#cbd5e1", marginTop: "0.75rem", lineHeight: 1.5 }}>
                Research de <span style={{ color: "#e2e8f0", fontWeight: "bold" }}>UI/UX</span> apoyado por <span style={{ color: "#e2e8f0", fontWeight: "bold" }}>Gemini</span> en plataformas como Dribbble.<br/>
                Definición de layouts estéticos y centrados en el usuario.
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className={`${styles.boxCard} ${styles.flex1} ${styles.flexCol}`} style={{ gap: "1.5rem", background: "transparent", border: "1px solid rgba(236, 72, 153, 0.5)", padding: "2rem" }}>
            <div className={styles.iconBox} style={{ width: "3.5rem", height: "3.5rem", background: "rgba(236, 72, 153, 0.1)", borderColor: "rgba(236, 72, 153, 0.3)" }}>
              <Sparkles size={28} color="#f472b6" />
            </div>
            <div>
              <div className={`${styles.textLg} ${styles.fontBold}`} style={{ color: "#f472b6" }}>Skills de Agente</div>
              <div className={styles.textSm} style={{ color: "#cbd5e1", marginTop: "0.75rem", lineHeight: 1.5 }}>
                <span style={{ color: "#e2e8f0", fontWeight: "bold" }}>UI/UX Expert & Vercel Patterns Composition</span><br/>
                Habilidades especializadas que garantizan una arquitectura React robusta, patrones escalables y diseño de primer nivel.
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className={`${styles.flexRow} ${styles.itemsCenter} ${styles.justifyCenter} ${styles.gap2}`} style={{ padding: "1.5rem 0 0 0", marginTop: "1rem" }}>
        <span className={styles.textBase} style={{ color: "#cbd5e1" }}>Un stack y flujo optimizado para velocidad, calidad y modernidad.</span>
        <Rocket size={20} className={styles.textBlue} />
      </div>
    </div>
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
            x: direction > 0 ? 50 : -50,
            scale: 0.98,
          },
          {
            autoAlpha: 1,
            x: 0,
            scale: 1,
            duration: 0.5,
            ease: "power2.out",
          },
        );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-slider-card]", { clearProps: "all" });
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

  const renderSlideContent = () => {
    switch (slide.id) {
      case 1: return <Slide1 />;
      case 2: return <Slide2 />;
      case 3: return <Slide3 />;
      case 4: return <Slide4 />;
      case 5: return <Slide5 />;
      case 6: return <Slide6 />;
      case 7: return <Slide7 />;
      case 8: return <Slide8 />;
      case 9: return <Slide9 />;
      case 10: return <Slide10 />;
      case 11: return <Slide11 />;
      case 12: return <Slide12 />;
      default: return null;
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container} ref={rootRef}>
        
        <header className={styles.header}>
          <div className={styles.topBar}>
            <span className={styles.badge}>AIOps Prime</span>
            <Link className={styles.topLink} href="/diapositivas">
              Ver versión texto
            </Link>
          </div>
        </header>

        <section className={styles.slideContainer}>
          <article className={styles.slide} data-slider-card key={slide.id}>
            <div className={styles.slideGlow} />
            <div className={styles.slideInner}>
              <header className={styles.slideHeader}>
                <div className={styles.slideNumber}>{slide.id}</div>
                <div className={styles.titleWrapper}>
                  <h2 className={styles.slideTitle}>
                    {slide.id === 1 ? <>{slide.title.replace('tecnologías', '')} <span className={styles.slideTitleHighlight}>tecnologías</span> a usar?</> :
                     slide.id === 2 ? <>{slide.title.replace('mejor tecnología', '')} <span className={styles.slideTitleHighlight}>mejor tecnología</span></> :
                     slide.id === 3 ? <>{slide.title.replace('tecnología correcta', '')} <span className={styles.slideTitleHighlight}>tecnología correcta</span></> :
                     slide.id === 4 ? <>{slide.title.replace('antes de codificar', '')} <span className={styles.slideTitleHighlight}>antes de codificar</span></> :
                     slide.id === 6 ? <>{slide.title.replace('ofrece', '')} <span className={styles.slideTitleHighlight}>ofrece</span></> :
                     slide.id === 7 ? <>{slide.title.replace('"un agente"', '')} <span className={styles.slideTitleHighlight}>&quot;un agente&quot;</span></> :
                     slide.id === 8 ? <>{slide.title.replace('+ Ejecución incremental', '')} <span className={styles.slideTitleHighlight}>+ Ejecución incremental</span></> :
                     slide.id === 9 ? <>{slide.title.replace('esta arquitectura?', '')} <span className={styles.slideTitleHighlight}>esta arquitectura?</span></> :
                     slide.id === 10 ? <>{slide.title.replace('aceptamos', '')} <span className={styles.slideTitleHighlight}>aceptamos</span></> :
                     slide.id === 11 ? <>{slide.title.replace('CopilotKit + Next.js?', '')} <span className={styles.slideTitleHighlight}>CopilotKit + Next.js?</span></> :
                     slide.id === 12 ? <>{slide.title.replace('utilizadas', '')} <span className={styles.slideTitleHighlight}>utilizadas</span></> :
                     slide.title}
                  </h2>
                </div>
              </header>

              <div className={styles.slideContent}>
                {renderSlideContent()}
              </div>
            </div>
          </article>
        </section>

        <footer className={styles.bottomBar}>
          <div className={styles.progressContainer}>
            <span className={styles.textMuted} style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              {currentIndex + 1} / {slideDeck.length}
            </span>
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

          <nav className={styles.controls} aria-label="Controles del slider">
            <button className={styles.controlBtn} onClick={goPrevious} type="button" aria-label="Anterior">
              <ChevronLeft size={24} />
            </button>
            <button className={styles.controlBtn} onClick={goNext} type="button" aria-label="Siguiente">
              <ChevronRight size={24} />
            </button>
          </nav>
        </footer>

      </div>
    </main>
  );
}

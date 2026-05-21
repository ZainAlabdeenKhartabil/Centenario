"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

export default function CarScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const velocityRef = useRef<HTMLSpanElement>(null);
  const rpmRef = useRef<HTMLSpanElement>(null);
  const disassemblyRef = useRef<HTMLSpanElement>(null);
  const gearRef = useRef<HTMLSpanElement>(null);
  const aeroDotRef = useRef<HTMLSpanElement>(null);
  const aeroTextRef = useRef<HTMLSpanElement>(null);

  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);

  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const totalImages = 160;

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 1; i <= totalImages; i++) {
      const img = new Image();
      const paddedIndex = String(i).padStart(3, "0");
      img.src = `/frames/ezgif-frame-${paddedIndex}.jpg`;

      const handleImageLoad = () => {
        loadedCount++;
        setImagesLoaded(loadedCount);
        if (loadedCount === totalImages) {
          setTimeout(() => {
            setIsLoading(false);
          }, 800);
        }
      };

      img.onload = handleImageLoad;
      img.onerror = handleImageLoad;

      images.push(img);
    }

    imagesRef.current = images;
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const drawImageCover = useCallback((ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
    const canvas = ctx.canvas;
    const imgWidth = img.width;
    const imgHeight = img.height;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth = canvasWidth;
    let drawHeight = canvasHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      drawHeight = canvasWidth / imgRatio;
      offsetY = (canvasHeight - drawHeight) / 2;
    } else {
      drawWidth = canvasHeight * imgRatio;
      offsetX = (canvasWidth - drawWidth) / 2;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, 0, 0, imgWidth, imgHeight, offsetX, offsetY, drawWidth, drawHeight);
  }, []);

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = contextRef.current || canvas.getContext("2d");
    if (!ctx) return;

    if (!contextRef.current) {
      contextRef.current = ctx;
    }

    const img = imagesRef.current[index];
    if (img && img.complete) {
      drawImageCover(ctx, img);
    }
  }, [drawImageCover]);

  const updateTelemetryAndStyles = useCallback((latest: number) => {

    const frameIndex = Math.min(159, Math.max(0, Math.round(latest * 159)));
    drawFrame(frameIndex);
    const disassemblyPct = Math.floor(latest * 100);
    if (disassemblyRef.current) {
      disassemblyRef.current.textContent = `${disassemblyPct}%`;
    }

    const velocityVal = Math.floor(latest * 350);
    if (velocityRef.current) {
      velocityRef.current.textContent = String(velocityVal);
    }

    let rpmVal = 1000;
    if (latest < 0.5) {
      rpmVal = Math.floor(1000 + (latest / 0.5) * 7500);
    } else {
      const t = (latest - 0.5) / 0.5;
      rpmVal = Math.floor(5500 + t * 1500);
    }
    if (rpmRef.current) {
      rpmRef.current.textContent = String(rpmVal);
    }

    let gearVal = "N";
    if (latest < 0.05) gearVal = "N";
    else if (latest < 0.18) gearVal = "1";
    else if (latest < 0.32) gearVal = "2";
    else if (latest < 0.48) gearVal = "3";
    else if (latest < 0.65) gearVal = "4";
    else if (latest < 0.80) gearVal = "5";
    else if (latest < 0.92) gearVal = "6";
    else gearVal = "7";
    if (gearRef.current) {
      gearRef.current.textContent = gearVal;
    }

    if (latest > 0.6) {
      if (aeroTextRef.current) aeroTextRef.current.textContent = "AERO WING: 100% DEPLOYED";
      if (aeroDotRef.current) {
        aeroDotRef.current.className = "inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse";
      }
    } else {
      if (aeroTextRef.current) aeroTextRef.current.textContent = "STANDARD FLOW";
      if (aeroDotRef.current) {
        aeroDotRef.current.className = "inline-block w-1.5 h-1.5 rounded-full bg-emerald-500";
      }
    }

    const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
      if (value <= inMin) return outMin;
      if (value >= inMax) return outMax;
      return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
    };

    let s1Opacity = 0;
    let s1Y = 0;
    let s1Scale = 1;
    if (latest <= 0.12) {
      s1Opacity = 1;
      s1Y = mapRange(latest, 0, 0.18, 0, -80);
      s1Scale = mapRange(latest, 0, 0.18, 1, 1.08);
    } else if (latest <= 0.18) {
      s1Opacity = mapRange(latest, 0.12, 0.18, 1, 0);
      s1Y = mapRange(latest, 0, 0.18, 0, -80);
      s1Scale = mapRange(latest, 0, 0.18, 1, 1.08);
    } else {
      s1Opacity = 0;
      s1Y = -80;
      s1Scale = 1.08;
    }

    if (section1Ref.current) {
      section1Ref.current.style.opacity = String(s1Opacity);
      section1Ref.current.style.transform = `translateY(${s1Y}px) scale(${s1Scale})`;
      section1Ref.current.style.display = s1Opacity === 0 ? "none" : "flex";
    }

    let s2Opacity = 0;
    let s2X = -40;
    if (latest < 0.25) {
      s2Opacity = 0;
      s2X = -40;
    } else if (latest <= 0.32) {
      s2Opacity = mapRange(latest, 0.25, 0.32, 0, 1);
      s2X = mapRange(latest, 0.25, 0.32, -40, 0);
    } else if (latest <= 0.55) {
      s2Opacity = 1;
      s2X = 0;
    } else if (latest <= 0.62) {
      s2Opacity = mapRange(latest, 0.55, 0.62, 1, 0);
      s2X = mapRange(latest, 0.55, 0.62, 0, -40);
    } else {
      s2Opacity = 0;
      s2X = -40;
    }

    if (section2Ref.current) {
      section2Ref.current.style.opacity = String(s2Opacity);
      section2Ref.current.style.transform = `translateX(${s2X}px)`;
      section2Ref.current.style.display = s2Opacity === 0 ? "none" : "flex";
    }

    let s3Opacity = 0;
    let s3Y = 60;
    let s3Scale = 0.94;
    if (latest < 0.72) {
      s3Opacity = 0;
      s3Y = 60;
      s3Scale = 0.94;
    } else if (latest <= 0.82) {
      s3Opacity = mapRange(latest, 0.72, 0.82, 0, 1);
      s3Y = mapRange(latest, 0.72, 0.82, 60, 0);
      s3Scale = mapRange(latest, 0.72, 0.82, 0.94, 1);
    } else {
      s3Opacity = 1;
      s3Y = 0;
      s3Scale = 1;
    }

    if (section3Ref.current) {
      section3Ref.current.style.opacity = String(s3Opacity);
      section3Ref.current.style.transform = `translateY(${s3Y}px) scale(${s3Scale})`;
      section3Ref.current.style.display = s3Opacity === 0 ? "none" : "flex";
    }
  }, [drawFrame]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = contextRef.current || canvas.getContext("2d");
    if (ctx) {
      if (!contextRef.current) contextRef.current = ctx;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const scrollPos = scrollYProgress.get();
      updateTelemetryAndStyles(scrollPos);
    }
  }, [scrollYProgress, updateTelemetryAndStyles]);

  useEffect(() => {
    if (isLoading) return;

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener("resize", handleResize);

    resizeCanvas();
    updateTelemetryAndStyles(0);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isLoading, resizeCanvas, updateTelemetryAndStyles]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (isLoading) return;
    updateTelemetryAndStyles(latest);
  });

  useEffect(() => {
    if (isLoading) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);

    const updateMouse = () => {
      setMousePos((prev) => {
        const dx = mouseRef.current.x - prev.x;
        const dy = mouseRef.current.y - prev.y;
        return {
          x: prev.x + dx * 0.1,
          y: prev.y + dy * 0.1,
        };
      });
      requestRef.current = requestAnimationFrame(updateMouse);
    };

    requestRef.current = requestAnimationFrame(updateMouse);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isLoading]);

  return (
    <div ref={containerRef} className="relative w-full h-[400vh] bg-black select-none">

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
          >
            <div className="absolute inset-8 border border-white/5 pointer-events-none" />
            <div className="absolute inset-12 border border-white/[0.02] pointer-events-none" />
            <div className="absolute top-8 left-8 font-mono text-[9px] text-zinc-600 tracking-widest uppercase">
              LAMBORGHINI TECH DIV // R&D DEPT
            </div>
            <div className="absolute bottom-8 right-8 font-mono text-[9px] text-zinc-600 tracking-widest uppercase">
              EST. SANT'AGATA BOLOGNESE
            </div>

            <div className="text-center font-mono">
              <div className="relative w-28 h-28 mx-auto mb-10 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-t border-r border-white/20"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute inset-3 rounded-full border-b border-l border-zinc-700/60"
                />
                <div className="text-xs text-white tracking-widest font-extrabold font-syncopate">
                  {Math.floor((imagesLoaded / totalImages) * 100)}%
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold tracking-[0.35em] font-syncopate uppercase text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] [text-shadow:0_0_5px_#22d3ee,0_0_20px_#06b6d4]">
                CENTENARIO
              </h2>
              <p className="text-zinc-500 text-[10px] uppercase tracking-[0.5em] mt-3 font-semibold">
                caching telemetry matrix
              </p>

              <div className="relative w-64 h-[2px] bg-zinc-900 mx-auto rounded-full overflow-hidden mt-8 mb-4">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-white"
                  style={{ width: `${(imagesLoaded / totalImages) * 100}%` }}
                />
              </div>

              <div className="text-[9px] text-zinc-600 tracking-widest uppercase h-4">
                {imagesLoaded < 40 && "Initializing Hydraulic Protocol..."}
                {imagesLoaded >= 40 && imagesLoaded < 80 && "Compiling Carbon Monocoque..."}
                {imagesLoaded >= 80 && imagesLoaded < 120 && "Coupling 6.5L L539 V12 Core..."}
                {imagesLoaded >= 120 && imagesLoaded < 160 && "Gauging Active Aero Telemetry..."}
                {imagesLoaded === 160 && "PROPULSION MATRIX COUPLING COMPLETE"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-black">

        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] z-10"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />

        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-hidden opacity-[0.04]">
          <div className="w-[150%] h-[1px] bg-white rotate-[15deg] origin-top-left translate-y-[20vh]" />
          <div className="w-[150%] h-[1px] bg-white rotate-[15deg] origin-top-left translate-y-[80vh]" />
        </div>

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover block z-0"
        />

        {!isLoading && (
          <>
            <div className="absolute top-6 left-8 pointer-events-none z-30 font-mono text-[9px] text-white/50 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="tracking-[0.2em] font-semibold uppercase">SYSTEM: CENTENARIO V12 // ONLINE</span>
            </div>

            <div className="absolute top-6 right-8 pointer-events-none z-30 font-mono text-[9px] text-white/50 text-right flex items-center gap-3">
              <span className="tracking-[0.2em] uppercase">DECONSTRUCTION PROTOCOL</span>
              <span
                ref={disassemblyRef}
                className="border border-white/20 px-2 py-0.5 rounded text-[9px] font-bold text-white bg-white/5 tracking-wider font-mono"
              >
                0%
              </span>
            </div>

            <div className="absolute bottom-8 left-8 right-8 pointer-events-none z-30 flex justify-between items-end border-t border-white/10 pt-5 font-mono text-[9px] text-white/50">
              <div className="flex gap-10 md:gap-14">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest">PROPULSION MATRIX</span>
                  <span className="text-white tracking-widest text-xs font-semibold">6.5L L539 V12</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest">VELOCITY TELEMETRY</span>
                  <span className="text-white tracking-widest text-xs font-semibold">
                    <span ref={velocityRef} className="font-extrabold text-sm text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 font-mono">0</span> KM/H
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest">RPM SHIFT DIAGRAM</span>
                  <span className="text-white tracking-widest text-xs font-semibold">
                    <span ref={rpmRef} className="font-extrabold text-sm text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 font-mono">1000</span> RPM
                  </span>
                </div>

                <div className="hidden sm:flex flex-col gap-1.5">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest">GEAR</span>
                  <span
                    ref={gearRef}
                    className="text-white tracking-widest text-xs font-extrabold border border-white/20 px-2 rounded-sm flex items-center justify-center min-w-[20px] h-5 bg-white/5 font-mono"
                  >
                    N
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest">ACTIVE AERODYNAMICS</span>
                <span className="text-white tracking-widest text-[9px] font-semibold flex items-center gap-2">
                  <span ref={aeroDotRef} className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span ref={aeroTextRef} className="uppercase font-mono">STANDARD FLOW</span>
                </span>
              </div>
            </div>

            <div
              className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-1/2 hidden md:block"
              style={{ left: mousePos.x, top: mousePos.y }}
            >
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute w-4 h-[1px] bg-white/30" />
                <div className="absolute h-4 w-[1px] bg-white/30" />
                <div className="absolute w-1.5 h-1.5 rounded-full bg-white/70" />
                <div className="absolute w-6 h-6 border border-white/10 rounded-full animate-[ping_3s_infinite_linear]" />

                <span className="absolute left-6 top-6 font-mono text-[8px] text-white/50 tracking-wider whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded border border-white/15">
                  X:{Math.round(mousePos.x)} Y:{Math.round(mousePos.y)}
                </span>
              </div>
            </div>
          </>
        )}

        {!isLoading && (
          <>
            <div
              ref={section1Ref}
              className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 px-4 transition-all duration-[150ms] ease-out pointer-events-none"
              style={{ opacity: 1, transform: "translateY(0px) scale(1)", display: "flex" }}
            >
              <div className="pointer-events-none absolute w-full max-w-4xl h-80 bg-white/[0.02] blur-3xl rounded-full -z-10" />

              <span className="font-mono text-xs text-white/40 uppercase tracking-[0.5em] mb-4">
                THE AUTOMOBILI LAMBORGHINI
              </span>
              <h1 className="text-5xl md:text-8xl lg:text-9xl font-extrabold tracking-[0.25em] font-syncopate select-none text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-500 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)] drop-shadow-[0_0_50px_rgba(6,182,212,0.4)]">
                CENTENARIO
              </h1>

              <div className="mt-8 flex gap-6 text-zinc-500 font-mono text-[9px] uppercase tracking-[0.3em]">
                <span>V12 PROTOCOL</span>
                <span>•</span>
                <span>770 PS</span>
                <span>•</span>
                <span>CARBON FIBER GRID</span>
              </div>

              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none"
              >
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-[0.3em]">
                  scroll to disassemble
                </span>
                <svg className="w-4 h-4 text-zinc-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </motion.div>
            </div>

            <div
              ref={section2Ref}
              className="absolute inset-y-0 left-0 w-full md:w-[48%] lg:w-[42%] flex flex-col justify-center px-8 md:px-16 z-20 pointer-events-none transition-all duration-[150ms] ease-out"
              style={{ opacity: 0, transform: "translateX(-40px)", display: "none" }}
            >
              <div className="pointer-events-auto bg-black/70 backdrop-blur-md border border-white/10 rounded-xl p-6 md:p-8 shadow-2xl flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest">
                    02 // PROPULSION MATRIX
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-extrabold tracking-wider font-syncopate uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
                  NATURALLY ASPIRATED FURY
                </h2>

                <p className="font-sans text-xs text-zinc-400 leading-relaxed tracking-wider font-light">
                  At the heart of the Centenario lies the most powerful naturally aspirated V12 engine ever engineered by Lamborghini. Delivering 770 CV of pure mechanical violence directly to all four wheels. No turbos. No latency. Just raw, unfiltered acoustic glory reaching redline at 8,600 RPM.
                </p>

                <div className="grid grid-cols-2 gap-3.5 mt-3">
                  <div className="border border-white/5 bg-white/[0.01] p-3 rounded-md flex flex-col gap-1 hover:border-white/15 transition-all">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-wider">01. DISPLACEMENT</span>
                    <span className="font-mono text-xs text-white font-semibold">6.5 LITERS V12</span>
                  </div>

                  <div className="border border-white/5 bg-white/[0.01] p-3 rounded-md flex flex-col gap-1 hover:border-white/15 transition-all">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-wider">02. HORSEPOWER</span>
                    <span className="font-mono text-xs text-white font-semibold">770 CV @ 8500 RPM</span>
                  </div>

                  <div className="border border-white/5 bg-white/[0.01] p-3 rounded-md flex flex-col gap-1 hover:border-white/15 transition-all">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-wider">03. PEAK TORQUE</span>
                    <span className="font-mono text-xs text-white font-semibold">690 NM @ 5500 RPM</span>
                  </div>

                  <div className="border border-white/5 bg-white/[0.01] p-3 rounded-md flex flex-col gap-1 hover:border-white/15 transition-all">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-wider">04. POWER RATIO</span>
                    <span className="font-mono text-xs text-white font-semibold">1.97 KG / HP</span>
                  </div>

                  <div className="border border-white/5 bg-white/[0.01] p-3 rounded-md flex flex-col gap-1 hover:border-white/15 transition-all">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-wider">05. 0-100 KM/H</span>
                    <span className="font-mono text-xs text-white font-semibold">2.8 SECONDS</span>
                  </div>

                  <div className="border border-white/5 bg-white/[0.01] p-3 rounded-md flex flex-col gap-1 hover:border-white/15 transition-all">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-wider">06. MONOCOQUE</span>
                    <span className="font-mono text-xs text-white font-semibold">FULL CARBON FIBER</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              ref={section3Ref}
              className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 px-4 pointer-events-none transition-all duration-[150ms] ease-out"
              style={{ opacity: 0, transform: "translateY(60px) scale(0.94)", display: "none" }}
            >
              <div className="pointer-events-none absolute w-full max-w-4xl h-80 bg-white/[0.01] blur-3xl rounded-full -z-10" />

              <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.4em] mb-4">
                03 // AERODYNAMIC BOUNDARIES
              </span>

              <h2 className="text-4xl md:text-7xl lg:text-8xl font-extrabold tracking-[0.3em] font-syncopate select-none text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
                BEYOND GRAVITY
              </h2>

              <p className="max-w-xl font-sans text-xs md:text-sm mt-6 leading-relaxed tracking-widest font-light">
                A perfect synthesis of raw mechanical aggression and futuristic aerodynamics. Every component has been fully deconstructed to showcase the intricate carbon weave, custom pushrod suspension, and state-of-the-art telemetry integration.
              </p>

              <div
                className="pointer-events-auto mt-12 flex flex-col items-center gap-3 cursor-pointer group"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <div className="relative w-12 h-12 flex items-center justify-center rounded-full border border-white/10 group-hover:border-white/40 bg-white/[0.02] group-hover:bg-white/[0.06] transition-all">
                  <motion.svg
                    animate={{ y: [3, -3, 3] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="w-4 h-4 text-white/70 group-hover:text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7 7 7M12 3v18" />
                  </motion.svg>
                </div>
                <span className="font-mono text-[8px] text-zinc-500 group-hover:text-zinc-300 uppercase tracking-widest transition-colors">
                  engage re-assembly (scroll to top)
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
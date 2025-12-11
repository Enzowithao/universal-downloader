"use client";

import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useEffect, useRef } from "react";

export default function BackgroundElements() {
    const { theme } = useTheme();

    const icons = [
        { src: "/Logos/Youtube_logo.png", delay: 0, x: "10%", y: "20%" },
        { src: "/Logos/instagram.png", delay: 1, x: "85%", y: "15%" },
        { src: "/Logos/tiktok.png", delay: 2, x: "15%", y: "70%" },
        { src: "/Logos/X-Logo.png", delay: 3, x: "80%", y: "65%" },
    ];

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none transition-colors duration-1000 ease-in-out bg-black">

            {/* THEME: AURORA (Default) */}
            {theme === 'aurora' && (
                <div className="absolute inset-0 opacity-40">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3],
                            x: [0, 50, 0],
                            y: [0, -30, 0],
                        }}
                        transition={{
                            duration: 15,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-purple-600/40 rounded-full blur-[120px] mix-blend-screen"
                    />
                    <motion.div
                        animate={{
                            scale: [1.1, 1, 1.1],
                            opacity: [0.3, 0.5, 0.3],
                            x: [0, -40, 0],
                            y: [0, 40, 0],
                        }}
                        transition={{
                            duration: 18,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 2
                        }}
                        className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] max-w-[700px] max-h-[700px] bg-blue-600/30 rounded-full blur-[130px] mix-blend-screen"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 5
                        }}
                        className="absolute top-[40%] left-[30%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] bg-pink-500/20 rounded-full blur-[100px] mix-blend-screen"
                    />
                </div>
            )}

            {/* THEME: PARTICLES (Network) */}
            {theme === 'particles' && (
                <div className="absolute inset-0">
                    <ParticlesCanvas />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80"></div>
                </div>
            )}

            {/* THEME: MESH (Retro Grid) */}
            {theme === 'mesh' && (
                <div className="absolute inset-0 perspective-[500px]">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 transform-gpu rotate-x-12 scale-150 origin-top"></div>
                    <motion.div
                        className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]"
                        animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
                        transition={{ duration: 10, repeat: Infinity }}
                    />
                </div>
            )}

            {/* --- MINIMAL THEME --- */}
            {theme === 'minimal' && (
                <div className="absolute inset-0 bg-neutral-900" />
            )}

            {/* --- CLOUDS THEME (Light) --- */}
            {theme === 'clouds' && (
                <>
                    <motion.div
                        animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-white rounded-full blur-[80px] opacity-60"
                    />
                    <motion.div
                        animate={{ x: [0, -80, 0], y: [0, 50, 0] }}
                        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-sky-100 rounded-full blur-[100px] opacity-50"
                    />
                </>
            )}

            {/* --- CANDY THEME (Light - Refined) --- */}
            {theme === 'candy' && (
                <>
                    {/* Base soft gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-pink-100 opacity-80" />

                    {/* Fluid Orbs */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            x: [0, 50, 0],
                            y: [0, 30, 0],
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-pink-300/40 rounded-full blur-[100px] mix-blend-multiply"
                    />

                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.2],
                            x: [0, -30, 0],
                            y: [0, 40, 0],
                        }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] bg-purple-300/40 rounded-full blur-[100px] mix-blend-multiply"
                    />

                    <motion.div
                        animate={{
                            x: [0, 40, 0],
                            y: [0, -40, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 }}
                        className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-sky-200/40 rounded-full blur-[100px] mix-blend-multiply"
                    />

                    {/* Small accent floating bubbles */}
                    <motion.div
                        animate={{ y: [0, -100, 0], x: [0, 20, 0], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[40%] left-[15%] w-32 h-32 bg-yellow-200/50 rounded-full blur-[40px] mix-blend-multiply"
                    />
                    <motion.div
                        animate={{ y: [0, 80, 0], x: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute top-[30%] right-[25%] w-40 h-40 bg-pink-200/50 rounded-full blur-[50px] mix-blend-multiply"
                    />
                </>
            )}

            {/* --- SUNSET THEME (Dark) --- */}
            {theme === 'sunset' && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-purple-900/20 to-orange-900/20" />
                    <motion.div
                        animate={{ y: [0, -20, 0], opacity: [0.5, 0.7, 0.5] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-[-20%] left-[20%] w-[800px] h-[600px] bg-orange-500 rounded-full blur-[120px] opacity-40"
                    />
                    <motion.div
                        className="absolute top-[10%] right-[10%] w-40 h-40 bg-purple-500 rounded-full blur-[80px] opacity-30"
                    />
                </>
            )}

            {/* Floating Icons (Visible on all except minimal) */}
            {theme !== 'minimal' && icons.map((item, i) => (
                <motion.div
                    key={i}
                    className="absolute opacity-50 will-change-transform"
                    style={{ left: item.x, top: item.y }}
                    animate={{
                        y: [0, -25, 0],
                        rotate: [0, 5, -5, 0],
                        filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"]
                    }}
                    transition={{
                        duration: 8 + i * 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: item.delay
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={item.src}
                        alt="Social Logo"
                        className="w-12 h-12 md:w-20 md:h-20 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] opacity-60"
                        style={{ filter: theme === 'particles' ? 'grayscale(100%) opacity(0.3)' : 'none' }}
                    />
                </motion.div>
            ))}

            {/* Common Overlays */}
            <div className={`absolute inset-0 bg-[url('/grid.svg')] ${theme === 'mesh' ? 'opacity-[0.05]' : 'opacity-[0.03]'}`} />
        </div>
    );
}

// Simple Particle Canvas Component
function ParticlesCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;

        const particles: { x: number, y: number, vx: number, vy: number }[] = [];
        const count = 50;

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5
            });
        }

        let animationFrameId: number;

        const draw = () => {
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = 'rgba(120, 120, 255, 0.5)';
            ctx.strokeStyle = 'rgba(120, 120, 255, 0.1)';

            for (let i = 0; i < count; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                if (p.y > h) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();

                // Connect
                for (let j = i + 1; j < count; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        const handleResize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 opacity-40" />;
}

"use client";

import { motion } from "framer-motion";
import { Youtube, Instagram, X as XIcon, Music2 } from "lucide-react";

export default function BackgroundElements() {
    const icons = [
        { Icon: Youtube, color: "text-red-500", delay: 0, x: "10%", y: "20%" },
        { Icon: Instagram, color: "text-pink-500", delay: 1, x: "85%", y: "15%" },
        { Icon: Music2, color: "text-purple-400", delay: 2, x: "15%", y: "70%" }, // TikTok vibe / Generic Audio
        { Icon: XIcon, color: "text-white", delay: 3, x: "80%", y: "65%" },
    ];

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Orbs Gradient */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/50 rounded-full blur-[100px]"
            />
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
                className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] bg-blue-600/40 rounded-full blur-[120px]"
            />

            {/* Floating Icons */}
            {icons.map((item, i) => (
                <motion.div
                    key={i}
                    className={`absolute ${item.color} opacity-60`}
                    style={{ left: item.x, top: item.y }}
                    animate={{
                        y: [0, -30, 0],
                        rotate: [0, 15, -15, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        duration: 6 + i,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: item.delay
                    }}
                >
                    <item.Icon size={56} />
                </motion.div>
            ))}

            {/* Grid Pattern (Optional, using CSS if SVG missing) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </div>
    );
}

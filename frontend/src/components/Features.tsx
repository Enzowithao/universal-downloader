// frontend/src/components/Features.tsx
"use client";

import { motion } from "framer-motion";
import { GlareCard } from "./GlareCard"; // Import de notre nouvelle carte
import { Zap, ShieldCheck, Video, Music } from "lucide-react";

const features = [
  {
    icon: <Zap className="text-white w-8 h-8" />,
    title: "Vitesse Éclair",
    desc: "Moteur de conversion optimisé pour des téléchargements instantanés.",
  },
  {
    icon: <Video className="text-white w-8 h-8" />,
    title: "Qualité 4K",
    desc: "Support natif jusqu'à 2160p (4K). Qualité cristalline.",
  },
  {
    icon: <Music className="text-white w-8 h-8" />,
    title: "Extraction Pure",
    desc: "Conversion MP3 320kbps avec métadonnées automatiques.",
  },
  {
    icon: <ShieldCheck className="text-white w-8 h-8" />,
    title: "Zéro Trace",
    desc: "Sécurité totale. Aucun log, aucune publicité, 100% privé.",
  },
];

export default function Features() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 mt-20 mb-20">

      {/* Titre de section */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">Pourquoi nous choisir ?</h2>
        <p className="text-neutral-400">Une technologie de pointe au service de vos contenus.</p>
      </div>

      {/* Grille de Glare Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <GlareCard className="flex flex-col items-center justify-center p-6 text-center">

              {/* Contenu à l'intérieur de la carte */}
              <div className="w-14 h-14 rounded-full bg-neutral-800/80 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20 backdrop-blur-sm">
                {item.icon}
              </div>

              <h3 className="text-xl font-bold text-white mb-2 tracking-wide">
                {item.title}
              </h3>

              <p className="text-neutral-400 text-sm leading-relaxed pb-2">
                {item.desc}
              </p>

            </GlareCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
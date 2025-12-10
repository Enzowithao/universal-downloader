"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Music, Video, X, User, Clock, Eye, Loader2, Pencil, Scissors, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { timeToSeconds, secondsToTime, calculateCutSize, getPlatformLogo } from "../lib/utils";
import { VideoData } from "../types";
import ReactPlayerSource from 'react-player';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactPlayer = ReactPlayerSource as any;

interface VideoCardProps {
  data: VideoData;
  onReset: () => void;
}

const formatViews = (num?: number) => {
  if (!num) return "N/A";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

const fireConfetti = () => {
  const count = 200;
  const defaults = { origin: { y: 0.7 }, colors: ['#8b5cf6', '#3b82f6', '#ffffff', '#a855f7'], disableForReducedMotion: true };
  function fire(particleRatio: number, opts: object) {
    confetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(count * particleRatio) }));
  }
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
};

export default function VideoCard({ data, onReset }: VideoCardProps) {
  const [imgError, setImgError] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [customTitle, setCustomTitle] = useState(data.title);
  const [statusText, setStatusText] = useState<string>("");

  // États pour le découpage
  const [durationSec, setDurationSec] = useState(0);
  const [range, setRange] = useState<number[] | number>([0, 0]);
  const [isTrimming, setIsTrimming] = useState(false);

  // État pour savoir si la vidéo a démarré (pour cacher la durée)
  const [hasStarted, setHasStarted] = useState(false);
  const [playerError, setPlayerError] = useState(false); // Gestion d'erreur lecture
  const [isMounted, setIsMounted] = useState(false);

  // Ref pour le player
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);

  // Détection du format
  const isVertical = data.is_vertical || false;

  // Logo de la plateforme
  const platformLogo = getPlatformLogo(data.original_url);

  useEffect(() => {
    setIsMounted(true);
    setCustomTitle(data.title);

    // Reset complet
    const seconds = timeToSeconds(data.duration);
    setDurationSec(seconds);
    setRange([0, seconds]);
    setIsTrimming(false);
    setHasStarted(false); // On réaffiche la durée/image quand la vidéo change
    setThumbnailError(false); // Reset l'erreur de thumbnail
    setPlayerError(false); // Reset l'erreur de lecture
  }, [data.original_url, data.title, data.duration]);

  const playerConfig = useMemo(() => {
    return {
      youtube: {
        playerVars: {
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          modestbranding: 1,
          rel: 0,
          playsinline: 1, // Important pour mobile
        }
      },
      twitch: {
        options: {
          parent: typeof window !== 'undefined' ? [window.location.hostname] : []
        }
      }
    };
  }, []);

  const handleDownload = async (formatId: string, label: string, index: number) => {
    setDownloadingIndex(index);
    setStatusText("Préparation...");

    try {
      // 1. Démarrer la préparation sur le serveur
      const currentRange = Array.isArray(range) ? range : [0, durationSec];
      const start = currentRange[0];
      const end = (currentRange[1] < durationSec) ? currentRange[1] : 0; // 0 veut dire "jusqu'à la fin"

      const prepareUrl = `http://127.0.0.1:8000/api/prepare?url=${encodeURIComponent(data.original_url || "")}&format_id=${encodeURIComponent(formatId)}&title=${encodeURIComponent(customTitle)}&start=${start}&end=${end}`;

      const prepareRes = await fetch(prepareUrl, { method: 'POST' });
      if (!prepareRes.ok) throw new Error("Erreur préparation");
      const { task_id } = await prepareRes.json();

      // 2. Boucle de polling pour la progression
      const pollInterval = setInterval(async () => {
        try {
          const progressRes = await fetch(`http://127.0.0.1:8000/api/progress/${task_id}`);
          if (progressRes.ok) {
            const task = await progressRes.json();

            if (task.status === 'downloading') {
              setStatusText(`Téléchargement... ${task.progress.toFixed(1)}%`);
            } else if (task.status === 'processing') {
              setStatusText("Traitement final...");
            } else if (task.status === 'finished') {
              clearInterval(pollInterval);
              setStatusText("Terminé !");
              setHasStarted(false); // Réafficher la thumbnail pour éviter l'écran gris
              setTimeout(() => setDownloadingIndex(null), 2000); // Masquer l'overlay de chargement après 2s

              // 3. Déclencher le téléchargement du fichier final
              triggerFileDownload(task_id, task.title || customTitle);
            } else if (task.status === 'error') {
              clearInterval(pollInterval);
              throw new Error(task.error || "Erreur inconnue");
            }
          }
        } catch (e) {
          console.error(e);
          clearInterval(pollInterval);
          setDownloadingIndex(null);
          toast.error("Erreur de suivi progression");
        }
      }, 500);

    } catch (e) {
      setDownloadingIndex(null);
      console.error(e);
      toast.error("Erreur de démarrage");
    }
  };

  const triggerFileDownload = (taskId: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `http://127.0.0.1:8000/api/download/${taskId}`;
    link.setAttribute('download', fileName); // Note: le serveur envoie aussi le bon header
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);

    fireConfetti();
    toast.success(`Terminé ! 🚀`);

    setTimeout(() => {
      setDownloadingIndex(null);
      setStatusText("");
    }, 2000);
  };

  const getRangeValues = () => Array.isArray(range) ? range : [0, 0];

  const handleSliderChange = (val: number | number[]) => {
    if (!Array.isArray(val)) return;

    const oldStart = Array.isArray(range) ? range[0] : 0;
    const oldEnd = Array.isArray(range) ? range[1] : 0;
    const newStart = val[0];
    const newEnd = val[1];

    setRange(val);

    // Si on bouge le curseur de début, on seek au début
    if (newStart !== oldStart) {
      if (playerRef.current?.seekTo) {
        playerRef.current.seekTo(newStart, 'seconds');
      }
      setHasStarted(true); // On force le démarrage si ça n'était pas fait
    }
    // Si on bouge le curseur de fin, on seek à la fin pour visualiser
    else if (newEnd !== oldEnd) {
      if (playerRef.current?.seekTo) {
        playerRef.current.seekTo(newEnd, 'seconds');
      }
      setHasStarted(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full max-w-4xl mx-auto mt-8 relative group"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[2rem] opacity-20 blur-xl group-hover:opacity-40 transition duration-1000"></div>

      <div className={`relative bg-[#0a0a0a] border border-neutral-800 rounded-[1.8rem] overflow-hidden shadow-2xl flex flex-col ${isVertical ? 'md:flex-row' : 'md:flex-col'}`}>

        {/* --- ZONE DU LECTEUR VIDÉO --- */}
        <div
          className={`relative bg-black group-video transition-all duration-500 ease-in-out ${isVertical ? 'md:w-5/12' : 'w-full'}`}
          style={{ aspectRatio: isVertical ? '9/16' : '16/9' }}
        >
          {isMounted && (
            <div className="absolute inset-0 w-full h-full bg-black">

              {/*
                   FIX UPDATE: On garde l'overlay TOUJOURS dans le DOM mais on joue sur l'opacité.
                   Cela évite que le DOM change brutalement au moment où le play() est lancé,
                   ce qui causait l'erreur "Runtime AbortError: media removed from document".
                */}
              <div
                className={`absolute inset-0 z-10 flex items-center justify-center bg-black transition-opacity duration-500 ${hasStarted && !playerError ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              >
                {/* GESTION D'ERREUR DE LECTURE */}
                {playerError ? (
                  <div className="text-center p-6 bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-2xl max-w-[80%]">
                    <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                    <h3 className="text-white font-bold text-lg mb-1">Lecture impossible</h3>
                    <p className="text-neutral-400 text-sm mb-4">Cette vidéo ne peut pas être lue ici (restrictions de l&apos;auteur).</p>
                    <a
                      href={data.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold rounded-full text-sm hover:bg-neutral-200 transition"
                    >
                      Ouvrir sur le site <Video className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <>
                    {/* 1. Essayer d'afficher la thumbnail de la vidéo */}
                    {data.thumbnail && !thumbnailError ? (
                      <>
                        <img
                          src={data.thumbnail}
                          alt={data.title}
                          className="w-full h-full object-cover opacity-90"
                          onError={() => setThumbnailError(true)}
                        />
                        {/* Petit gradient pour lisibilité */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </>
                    ) : (
                      /* 2. Fallback : Logo de la plateforme si pas de thumbnail */
                      platformLogo && (
                        <div className="relative flex items-center justify-center w-full h-full p-8">
                          <img
                            src={platformLogo}
                            alt="Platform logo"
                            className="w-full h-full object-contain opacity-80 drop-shadow-2xl"
                            onError={() => { }}
                          />
                        </div>
                      )
                    )}

                    {/* LOGO DE LA PLATEFORME (en haut à droite) */}
                    {platformLogo && (
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-2 shadow-lg pointer-events-none z-30">
                        <img
                          src={platformLogo}
                          alt="Platform logo"
                          className="w-8 h-8 object-contain"
                          onError={() => { }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {!playerError && (
                <ReactPlayer
                  ref={playerRef}
                  key={data.original_url} // Reset si l'URL change
                  url={
                    // Si c'est YouTube, on utilise l'URL normale (iframe stable)
                    // Sinon (TikTok, X...), on passe par notre proxy backend pour éviter les blocages
                    (data.original_url?.includes('youtube.com') || data.original_url?.includes('youtu.be'))
                      ? data.original_url
                      : `http://localhost:8000/api/stream?url=${encodeURIComponent(data.original_url || "")}`
                  }
                  width="100%"
                  height="100%"
                  controls={true}
                  playsinline={true}

                  // Pas de mode light, on gère nous-mêmes l'affichage
                  playing={hasStarted}

                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  config={playerConfig as any}

                  // Quand la vidéo commence
                  onStart={() => setHasStarted(true)}
                  onPlay={() => setHasStarted(true)}

                  // Gestion d'erreur
                  onError={(e: unknown) => {
                    console.error("Erreur lecture:", e);
                    setPlayerError(true);
                    setHasStarted(false);
                  }}

                  // FIX: On garde l'opacité à 1 pour éviter que le navigateur ne "détache" le média (AbortError)
                  style={{ position: 'absolute', top: 0, left: 0, zIndex: hasStarted ? 20 : 0, opacity: 1 }}
                />
              )}

              {/* DURÉE (S'affiche tant que la vidéo n'a pas commencé et pas d'erreur) */}
              {!hasStarted && !playerError && (
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg pointer-events-none z-30">
                  <Clock className="w-3 h-3 text-neutral-300" />
                  {data.duration}
                </div>
              )}
            </div>
          )}

          {/* Overlay de téléchargement */}
          <AnimatePresence>
            {downloadingIndex !== null && (
              <motion.div initial={{ opacity: 0, backdropFilter: "blur(0px)" }} animate={{ opacity: 1, backdropFilter: "blur(12px)" }} className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center text-center p-6">
                <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
                <motion.p key={statusText} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-white font-medium text-base mb-3">{statusText}</motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- ZONE D'INFORMATIONS --- */}
        <div className={`p-6 md:p-8 flex flex-col justify-between relative ${isVertical ? 'md:w-7/12' : 'w-full'}`}>
          <button onClick={onReset} className="absolute top-4 right-4 p-2 rounded-full bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white transition"><X className="w-5 h-5" /></button>

          <div className="mb-6 space-y-4">
            {/* Titre et Format Détecté */}
            <div className="relative group/edit">
              <div className="text-xs font-mono mb-2 p-2 bg-neutral-900/50 rounded-lg inline-block border border-neutral-700 shadow-sm">
                <span className="text-neutral-400 font-semibold tracking-wider">FORMAT DÉTECTÉ: </span>
                <span className={isVertical ? "text-blue-400 font-bold" : "text-green-400 font-bold"}>
                  {isVertical ? "📱 VERTICAL (9:16)" : "💻 HORIZONTAL (16:9)"}
                </span>
              </div>

              <input type="text" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} className="w-full bg-transparent text-2xl md:text-3xl font-bold leading-tight text-white border-b border-transparent focus:border-purple-500 outline-none transition-all placeholder-neutral-600 md:pr-10 pb-1" />
              <Pencil className="absolute top-2 right-2 w-5 h-5 text-neutral-600 opacity-0 group-hover/edit:opacity-100 pointer-events-none transition-opacity" />
            </div>

            {/* Slider de découpage */}
            {durationSec > 0 && (
              <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest"><Scissors className="w-3 h-3" /> Découpage</div>
                  <button onClick={() => setIsTrimming(!isTrimming)} className={`text-[10px] px-2 py-1 rounded border transition ${isTrimming ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-white'}`}>{isTrimming ? "ACTIVÉ" : "DÉSACTIVÉ"}</button>
                </div>
                <AnimatePresence>
                  {isTrimming && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-2 pb-2">
                        <Slider range min={0} max={durationSec} value={range} onChange={handleSliderChange} trackStyle={[{ backgroundColor: '#8b5cf6' }]} handleStyle={[{ borderColor: '#8b5cf6', backgroundColor: '#000' }, { borderColor: '#8b5cf6', backgroundColor: '#000' }]} railStyle={{ backgroundColor: '#262626' }} />
                        <div className="flex justify-between mt-3 text-xs font-mono font-medium text-white items-center">
                          <div className="flex gap-2 items-center">
                            <span className="bg-neutral-800 px-2 py-1 rounded border border-neutral-700">{secondsToTime(getRangeValues()[0])}</span>
                            <span className="text-neutral-500">➜</span>
                            <span className="bg-neutral-800 px-2 py-1 rounded border border-neutral-700">{secondsToTime(getRangeValues()[1])}</span>
                          </div>
                        </div>
                        <div className="text-center mt-2 text-[10px] text-neutral-500">Durée finale : {secondsToTime(getRangeValues()[1] - getRangeValues()[0])}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Infos Uploader et Vues */}
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50 border border-neutral-700/50 text-neutral-200">
                {data.avatar && !imgError ? (
                  <img src={data.avatar} alt={data.uploader} className="w-5 h-5 rounded-full object-cover shadow-sm" onError={() => setImgError(true)} />
                ) : (<User className="w-4 h-4 text-purple-400" />)}
                <span className="truncate max-w-[150px]">{data.uploader}</span>
              </div>
              {data.views != null && (<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50 border border-neutral-700/50 text-neutral-400"><Eye className="w-4 h-4" /><span>{formatViews(data.views)} vues</span></div>)}
            </div>
          </div>

          {/* Boutons de téléchargement */}
          <div className="space-y-3">
            {/* AVERTISSEMENT DE TÉLÉCHARGEMENT */}
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500/90 text-xs mb-1">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Le téléchargement peut prendre du temps selon votre connexion et la taille de la vidéo. Merci de patienter.</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {data.formats.map((fmt, i) => {
                const currentVals = getRangeValues();
                const displaySize = isTrimming ? calculateCutSize(fmt.size, durationSec, currentVals[1] - currentVals[0]) : fmt.size;
                const isAudio = fmt.ext === 'mp3' || fmt.label.toLowerCase().includes('audio');

                return (
                  <button key={i} onClick={() => handleDownload(fmt.id, fmt.label, i)} disabled={downloadingIndex !== null} className="group cursor-pointer relative overflow-hidden flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-wait">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-white/5 ${!isAudio ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {!isAudio ? <Video className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                      </div>
                      <div className="text-left">
                        <div className="text-white font-semibold text-sm flex items-center gap-2">{fmt.label} <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-300 font-mono">{fmt.ext.toUpperCase()}</span></div>
                        <div className={`text-xs mt-0.5 transition-colors ${isTrimming ? "text-green-400 font-medium" : "text-neutral-500"}`}>{displaySize}</div>
                      </div>
                    </div>
                    <div className="relative z-10 w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                      {downloadingIndex === i ? (<Loader2 className="w-4 h-4 animate-spin text-white" />) : (<Download className="w-4 h-4" />)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
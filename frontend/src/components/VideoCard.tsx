"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Music, Video, X, User, Clock, Eye, Loader2, Pencil, Scissors, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { timeToSeconds, secondsToTime, calculateCutSize, getPlatformLogo } from "../lib/utils";
import { VideoData } from "../types";
import { API_URL } from "../config";
import ReactPlayerSource from 'react-player';
import { useWebSocket } from '../hooks/useWebSocket';

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
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const { subscribe } = useWebSocket();

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
  const isVertical = data.orientation === 'portrait' || (data.orientation === undefined && data.is_vertical);

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

      const prepareUrl = `${API_URL}/api/prepare?url=${encodeURIComponent(data.original_url || "")}&format_id=${encodeURIComponent(formatId)}&title=${encodeURIComponent(customTitle)}&start=${start}&end=${end}`;

      const prepareRes = await fetch(prepareUrl, { method: 'POST' });
      if (!prepareRes.ok) throw new Error("Erreur préparation");
      const { task_id } = await prepareRes.json();

      setCurrentTaskId(task_id);

    } catch (e) {
      setDownloadingIndex(null);
      console.error(e);
      toast.error("Erreur de démarrage");
    }
  };

  useEffect(() => {
    const unsubscribe = subscribe((msg) => {
      if (!currentTaskId || msg.taskId !== currentTaskId) return;

      if (msg.status === 'downloading') {
        // Keep the overlay active (don't set to null) but update the text
        // Set index to 0 (or whatever current index is being downloaded, assumed 0 for single card context)
        // If downloadingIndex is null (e.g. from previous clear), set it back to active index
        setDownloadingIndex((prev) => prev !== null ? prev : 0);
        setStatusText(`Téléchargement... ${msg.progress?.toFixed(0)}%`);
      } else if (msg.status === 'processing') {
        setDownloadingIndex(0); // Show overlay for processing phase
        setStatusText("Traitement final...");
      } else if (msg.status === 'finished') {
        setStatusText("Terminé !");
        setHasStarted(false);
        setDownloadingIndex(null);

        // 3. Déclencher le téléchargement du fichier final
        triggerFileDownload(currentTaskId, msg.title || customTitle);
        setCurrentTaskId(null);
      } else if (msg.status === 'error') {
        setDownloadingIndex(null);
        toast.error(msg.error || "Erreur inconnue");
        setCurrentTaskId(null);
      }
    });

    return () => unsubscribe();
  }, [subscribe, currentTaskId, customTitle]);

  const triggerFileDownload = (taskId: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `${API_URL}/api/download/${taskId}`;
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
      <div className="absolute -inset-1 bg-gradient-to-r from-accent to-blue-600 rounded-[2rem] opacity-20 blur-xl group-hover:opacity-40 transition duration-1000"></div>

      <div className={`relative bg-card border border-border rounded-[1.8rem] overflow-hidden shadow-2xl flex flex-col ${isVertical ? 'md:flex-row md:items-stretch' : 'md:flex-col'}`}>

        {/* --- ZONE DU LECTEUR VIDÉO --- */}
        <div
          className={`relative bg-black group-video transition-all duration-500 ease-in-out ${isVertical ? 'md:w-5/12' : 'w-full'}`}
          style={{
            aspectRatio:
              (!isVertical) ? '16/9' : undefined, // Let flex handle height for vertical in side-by-side
            height: isVertical ? 'auto' : undefined // Fill height in flex row
          }}
        >
          {/* Wrapper to enforce ratio inside the flex item if needed, but 'auto' height is better for side-by-side match */}
          <div className="w-full h-full relative" style={{ aspectRatio: isVertical ? (data.orientation === 'square' ? '1/1' : '9/16') : '16/9' }}>
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
                            src={
                              // Si c'est Instagram, on passe DIRECTEMENT par le proxy pour éviter le 403
                              (data.original_url?.includes('instagram.com') || data.original_url?.includes('tiktok.com'))
                                ? `${API_URL}/api/proxy_image?url=${encodeURIComponent(data.thumbnail)}`
                                : data.thumbnail
                            }
                            alt={data.title}
                            className="w-full h-full object-cover opacity-90"
                            onError={() => {
                              // Si le chargement échoue, on masque
                              setThumbnailError(true);
                            }}
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
        </div>

        {/* --- ZONE D'INFORMATIONS --- */}
        <div className={`p-6 md:p-8 flex flex-col justify-between relative ${isVertical ? 'md:w-7/12' : 'w-full'} text-foreground`}>
          <button onClick={onReset} className="absolute top-4 right-4 p-2 rounded-full bg-muted/20 hover:bg-muted/30 text-muted hover:text-foreground transition"><X className="w-5 h-5" /></button>

          <div className="mb-6 space-y-4">
            {/* Titre et Format Détecté */}
            <div className="relative group/edit">
              <div className="text-xs font-mono mb-2 p-2 bg-muted/10 rounded-lg inline-block border border-border shadow-sm">
                <span className="text-muted font-semibold tracking-wider">FORMAT DÉTECTÉ: </span>
                <span className={`font-bold ${data.orientation === 'portrait' ? "text-blue-400" :
                  data.orientation === 'square' ? "text-purple-400" :
                    "text-green-400"
                  }`}>
                  {data.orientation === 'portrait' ? "📱 VERTICAL (9:16)" :
                    data.orientation === 'square' ? "⬜ CARRÉ (1:1)" :
                      "💻 HORIZONTAL (16:9)"}
                </span>
              </div>

              <input type="text" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} className="w-full bg-transparent text-2xl md:text-3xl font-bold leading-tight text-foreground border-b border-transparent focus:border-accent outline-none transition-all placeholder:text-muted md:pr-10 pb-1" />
              <Pencil className="absolute top-2 right-2 w-5 h-5 text-muted opacity-0 group-hover/edit:opacity-100 pointer-events-none transition-opacity" />
            </div>

            {/* Slider de découpage */}
            {durationSec > 0 && (
              <div className="bg-muted/5 rounded-xl p-4 border border-border">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-widest"><Scissors className="w-3 h-3" /> Découpage</div>
                  <button onClick={() => setIsTrimming(!isTrimming)} className={`text-[10px] px-2 py-1 rounded border transition ${isTrimming ? 'bg-accent/10 border-accent text-accent' : 'bg-muted/10 border-border text-muted hover:text-foreground'}`}>{isTrimming ? "ACTIVÉ" : "DÉSACTIVÉ"}</button>
                </div>
                <AnimatePresence>
                  {isTrimming && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-2 pb-2">
                        <Slider range min={0} max={durationSec} value={range} onChange={handleSliderChange} trackStyle={[{ backgroundColor: 'var(--accent)' }]} handleStyle={[{ borderColor: 'var(--accent)', backgroundColor: 'var(--background)' }, { borderColor: 'var(--accent)', backgroundColor: 'var(--background)' }]} railStyle={{ backgroundColor: 'var(--border)' }} />
                        <div className="flex justify-between mt-3 text-xs font-mono font-medium text-foreground items-center">
                          <div className="flex gap-2 items-center">
                            <span className="bg-muted/10 px-2 py-1 rounded border border-border">{secondsToTime(getRangeValues()[0])}</span>
                            <span className="text-muted">➜</span>
                            <span className="bg-muted/10 px-2 py-1 rounded border border-border">{secondsToTime(getRangeValues()[1])}</span>
                          </div>
                        </div>
                        <div className="text-center mt-2 text-[10px] text-muted">Durée finale : {secondsToTime(getRangeValues()[1] - getRangeValues()[0])}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Infos Uploader et Vues */}
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/10 border border-border text-foreground">
                {data.avatar && !imgError ? (
                  <img src={data.avatar} alt={data.uploader} className="w-5 h-5 rounded-full object-cover shadow-sm" onError={() => setImgError(true)} />
                ) : (<User className="w-4 h-4 text-accent" />)}
                <span className="truncate max-w-[150px]">{data.uploader}</span>
              </div>
              {data.views != null && (<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/10 border border-border text-muted"><Eye className="w-4 h-4" /><span>{formatViews(data.views)} vues</span></div>)}
            </div>
          </div>

          {/* Boutons de téléchargement */}
          <div className="space-y-3">
            {/* AVERTISSEMENT DE TÉLÉCHARGEMENT */}
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 dark:text-yellow-500 text-xs mb-1">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Le téléchargement peut prendre du temps selon votre connexion et la taille de la vidéo. Merci de patienter.</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {data.formats.map((fmt, i) => {
                const currentVals = getRangeValues();
                const displaySize = isTrimming ? calculateCutSize(fmt.size, durationSec, currentVals[1] - currentVals[0]) : fmt.size;
                const isAudio = fmt.ext === 'mp3' || fmt.label.toLowerCase().includes('audio');

                return (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.2 }}
                    key={i}
                    onClick={() => handleDownload(fmt.id, fmt.label, i)}
                    disabled={downloadingIndex !== null}
                    className="group cursor-pointer relative overflow-hidden flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border hover:border-muted hover:bg-card transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-wait"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-border ${!isAudio ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/20 text-purple-500'}`}>
                        {!isAudio ? <Video className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                      </div>
                      <div className="text-left">
                        <div className="text-foreground font-semibold text-sm flex items-center gap-2">{fmt.label} <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/20 text-muted font-mono">{fmt.ext.toUpperCase()}</span></div>
                        <div className={`text-xs mt-0.5 transition-colors ${isTrimming ? "text-green-500 font-medium" : "text-muted"}`}>{displaySize}</div>
                      </div>
                    </div>
                    <div className="relative z-10 w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                      {downloadingIndex === i ? (<Loader2 className="w-4 h-4 animate-spin text-foreground" />) : (<Download className="w-4 h-4" />)}
                    </div>
                  </motion.button>
                );
              })}

              {/* Bouton pour créer un GIF */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                onClick={() => handleDownload('gif', 'GIF Animé', 999)}
                disabled={downloadingIndex !== null}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="group cursor-pointer relative overflow-hidden flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border hover:border-green-500/50 hover:bg-card transition-all disabled:opacity-50 disabled:cursor-wait mt-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-border bg-green-500/10 text-green-500">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-foreground font-semibold text-sm flex items-center gap-2">Créer un GIF <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-600 dark:text-green-400 font-mono">NOUVEAU</span></div>
                    <div className="text-xs mt-0.5 text-muted">Max 720p • Sans son</div>
                  </div>
                </div>
                <div className="relative z-10 w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                  {downloadingIndex === 999 ? (<Loader2 className="w-4 h-4 animate-spin text-foreground" />) : (<Download className="w-4 h-4" />)}
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
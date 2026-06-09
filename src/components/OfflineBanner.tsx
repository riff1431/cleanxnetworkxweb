import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          key="offline"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[99] flex items-center justify-center gap-2 bg-destructive px-4 py-2.5 text-destructive-foreground text-sm font-medium shadow-lg"
        >
          <WifiOff className="h-4 w-4" />
          <span>You're offline — check your internet connection</span>
        </motion.div>
      )}
      {showReconnected && !isOffline && (
        <motion.div
          key="online"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[99] flex items-center justify-center gap-2 bg-green-600 px-4 py-2.5 text-white text-sm font-medium shadow-lg"
        >
          <Wifi className="h-4 w-4" />
          <span>You're back online!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;

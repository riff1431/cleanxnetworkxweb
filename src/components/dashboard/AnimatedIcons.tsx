import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import {
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Sparkles,
  Plus,
  Wallet,
  Briefcase,
  Crown,
  Settings,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  History,
  FileQuestion,
  FileText
} from "lucide-react";

interface AnimatedIconProps extends HTMLMotionProps<"div"> {
  className?: string;
  size?: number;
}

export const AnimatedCalendar = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, size = 20, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1.1 }}
        transition={{ duration: 0.5 }}
        className={className}
        {...props}
      >
        <Calendar size={size} />
      </motion.div>
    );
  }
);
AnimatedCalendar.displayName = "AnimatedCalendar";

export const AnimatedCheckCircle = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, size = 20, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ scale: 1.15, rotate: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className={className}
        {...props}
      >
        <CheckCircle size={size} />
      </motion.div>
    );
  }
);
AnimatedCheckCircle.displayName = "AnimatedCheckCircle";

export const AnimatedClock = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, size = 20, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className={className}
        {...props}
      >
        <Clock size={size} />
      </motion.div>
    );
  }
);
AnimatedClock.displayName = "AnimatedClock";

export const AnimatedMapPin = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, size = 20, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
        className={className}
        {...props}
      >
        <MapPin size={size} />
      </motion.div>
    );
  }
);
AnimatedMapPin.displayName = "AnimatedMapPin";

export const AnimatedSparkles = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, size = 20, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ scale: [1, 1.2, 0.9, 1.1, 1] }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          animate: { repeat: Infinity, duration: 2 },
          whileHover: { duration: 0.6 }
        }}
        className={className}
        {...props}
      >
        <Sparkles size={size} />
      </motion.div>
    );
  }
);
AnimatedSparkles.displayName = "AnimatedSparkles";

export const AnimatedPlus = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, size = 20, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ rotate: 180, scale: 1.15 }}
        transition={{ duration: 0.3 }}
        className={className}
        {...props}
      >
        <Plus size={size} />
      </motion.div>
    );
  }
);
AnimatedPlus.displayName = "AnimatedPlus";

export const AnimatedWallet = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, size = 20, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ rotateY: 180, scale: 1.1 }}
        transition={{ duration: 0.6 }}
        className={className}
        {...props}
      >
        <Wallet size={size} />
      </motion.div>
    );
  }
);
AnimatedWallet.displayName = "AnimatedWallet";

export const AnimatedBriefcase = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, size = 20, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ x: [-2, 2, -2, 2, 0], scale: 1.05 }}
        transition={{ duration: 0.4 }}
        className={className}
        {...props}
      >
        <Briefcase size={size} />
      </motion.div>
    );
  }
);
AnimatedBriefcase.displayName = "AnimatedBriefcase";

export const AnimatedCrown = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, size = 20, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ y: -4, rotate: [0, -5, 5, -5, 0] }}
        transition={{ duration: 0.5 }}
        className={className}
        {...props}
      >
        <Crown size={size} />
      </motion.div>
    );
  }
);
AnimatedCrown.displayName = "AnimatedCrown";

export const AnimatedSettings = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, size = 20, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ rotate: 90 }}
        transition={{ duration: 0.4 }}
        className={className}
        {...props}
      >
        <Settings size={size} />
      </motion.div>
    );
  }
);
AnimatedSettings.displayName = "AnimatedSettings";

export const AnimatedMessage = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, size = 20, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ scale: 1.15, y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        className={className}
        {...props}
      >
        <MessageSquare size={size} />
      </motion.div>
    );
  }
);
AnimatedMessage.displayName = "AnimatedMessage";

export const AnimatedArrowRight = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, size = 20, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ x: 5 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className={className}
        {...props}
      >
        <ArrowRight size={size} />
      </motion.div>
    );
  }
);
AnimatedArrowRight.displayName = "AnimatedArrowRight";

export const AnimatedTrendingUp = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, size = 20, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ scale: 1.1, y: -2 }}
        transition={{ duration: 0.2 }}
        className={className}
        {...props}
      >
        <TrendingUp size={size} />
      </motion.div>
    );
  }
);
AnimatedTrendingUp.displayName = "AnimatedTrendingUp";

export const AnimatedHistory = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, size = 20, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ rotate: -360 }}
        transition={{ duration: 0.8 }}
        className={className}
        {...props}
      >
        <History size={size} />
      </motion.div>
    );
  }
);
AnimatedHistory.displayName = "AnimatedHistory";

export const AnimatedFileQuestion = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, size = 20, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ y: -3, scale: 1.1 }}
        transition={{ duration: 0.2 }}
        className={className}
        {...props}
      >
        <FileQuestion size={size} />
      </motion.div>
    );
  }
);
AnimatedFileQuestion.displayName = "AnimatedFileQuestion";

export const AnimatedFileText = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, size = 20, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
        transition={{ duration: 0.3 }}
        className={className}
        {...props}
      >
        <FileText size={size} />
      </motion.div>
    );
  }
);
AnimatedFileText.displayName = "AnimatedFileText";

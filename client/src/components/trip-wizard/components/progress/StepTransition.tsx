import { motion, AnimatePresence } from "framer-motion";
import { TransitionProps } from "@/types/trip-wizard";

export function StepTransition({ 
  children, 
  isActive, 
  direction = 'forward' 
}: TransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={`step-${isActive}`}
          initial={{ 
            opacity: 0, 
            x: direction === 'forward' ? 20 : -20 
          }}
          animate={{ 
            opacity: 1, 
            x: 0 
          }}
          exit={{ 
            opacity: 0, 
            x: direction === 'forward' ? -20 : 20 
          }}
          transition={{ 
            duration: 0.3, 
            ease: "easeInOut" 
          }}
          className="w-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
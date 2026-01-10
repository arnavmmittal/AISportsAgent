/**
 * Motion Patterns - AI Sports Agent
 *
 * Shared Framer Motion variants for consistent animations across the platform.
 * Athletic minimalist approach: vertical offset instead of scale transforms.
 */

import { Variants, Transition } from 'framer-motion';

/**
 * Hover lift effect - vertical offset only (NO scale transforms)
 * Use this for interactive cards and buttons
 */
export const hoverLift = {
  rest: {
    y: 0,
    transition: { duration: 0.2, ease: [0, 0, 0.2, 1] as const },
  },
  hover: {
    y: -3,
    transition: { duration: 0.2, ease: [0, 0, 0.2, 1] as const },
  },
};

/**
 * Subtle hover lift for smaller elements
 */
export const hoverLiftSmall = {
  rest: {
    y: 0,
    transition: { duration: 0.15, ease: [0, 0, 0.2, 1] as const },
  },
  hover: {
    y: -2,
    transition: { duration: 0.15, ease: [0, 0, 0.2, 1] as const },
  },
};

/**
 * Stagger container for animating lists
 */
export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/**
 * Fade in from bottom (used with staggerContainer)
 */
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

/**
 * Fade in from top
 */
export const fadeInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

/**
 * Simple fade in
 */
export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

/**
 * Slide in from right
 */
export const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

/**
 * Slide in from left
 */
export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

/**
 * Scale in (use sparingly - prefer fadeIn)
 */
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
};

/**
 * Page transition - slide up
 */
export const pageTransition: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 25,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * Pulse animation for attention
 */
export const pulse: Variants = {
  rest: {
    scale: 1,
  },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'loop',
      ease: 'easeInOut',
    },
  },
};

/**
 * Shake animation for errors
 */
export const shake: Variants = {
  animate: {
    x: [-5, 5, -5, 5, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};

/**
 * Spring transition presets
 */
export const springTransitions = {
  // Fast and snappy (athletic feel)
  fast: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  },
  // Medium (balanced)
  medium: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },
  // Slow and smooth
  slow: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25,
  },
  // Bouncy (use sparingly)
  bouncy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 20,
  },
} as const;

/**
 * Easing curves (for non-spring animations)
 */
export const easings = {
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  sharp: [0.4, 0, 0.6, 1],
} as const;

/**
 * Duration presets (in seconds)
 */
export const durations = {
  fast: 0.15,
  medium: 0.3,
  slow: 0.5,
} as const;

/**
 * Example usage:
 *
 * ```tsx
 * import { motion } from 'framer-motion';
 * import { fadeInUp, staggerContainer, hoverLift } from '@/design-system/motion';
 *
 * <motion.div
 *   variants={staggerContainer}
 *   initial="hidden"
 *   animate="show"
 * >
 *   {items.map(item => (
 *     <motion.div
 *       key={item.id}
 *       variants={fadeInUp}
 *       whileHover={hoverLift.hover}
 *     >
 *       {item.content}
 *     </motion.div>
 *   ))}
 * </motion.div>
 * ```
 */

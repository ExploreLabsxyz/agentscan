import { motion } from "framer-motion";

interface AnimatedUnicornProps {
  scale?: number;
}

export default function AnimatedUnicorn({ scale = 1 }: AnimatedUnicornProps) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ transform: `scale(${scale})` }}
    >
      <motion.div
        style={{ fontSize: "64px" }}
        animate={{
          y: [-5, 5, -5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        🦄
      </motion.div>
    </div>
  );
}

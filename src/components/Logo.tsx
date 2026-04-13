import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface LogoProps {
  isOpen?: boolean;
}

export const Logo = ({ isOpen = true }: LogoProps) => {
  return (
    <Link
      to="/"
      className="flex items-center justify-center rounded-xl"
      aria-label="aguApp inicio"
    >
      <motion.img
        src={isOpen ? "/logo.png" : "/logo-1.png"}
        alt="aguApp"
        className={`object-contain transition-all duration-200 ${
          isOpen ? "h-24 w-auto" : "h-11 w-11 rounded-xl"
        }`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
      />
    </Link>
  );
};

import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png"
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeDown } from "@/lib/animations";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <div className="">
      <motion.nav
        variants={fadeDown}
        initial="hidden"
        animate="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="fixed top-3 left-0 right-0 mx-auto  items-center  w-[80%] rounded-md  z-50 bg-background/80 shadow-lg backdrop-blur-lg border-b border-border/30"
      >
        <div className="container mx-auto max-w-6xl flex items-center justify-between h-14 px-5">
          <Link to="/" className="flex items-center">
            {/* Light mode logo */}
            <img
              src={logoLight}
              alt="Nutrify"
              className="h-10 w-auto block dark:hidden"
            />
            {/* Dark mode logo */}
            <img
              src={logoDark}
              alt="Nutrify"
              className="h-10 w-auto hidden dark:block"
            />
          </Link>

          <div className="flex items-center gap-6">
           
            <Button
              onClick={() => navigate("/app")}
              size="sm"
              className="nutrify-gradient text-primary-foreground border-0 rounded-lg font-medium h-9 px-5 hover:opacity-90 transition-opacity"
            >
              Open App
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </motion.nav>
    </div>
  );
};

export default Navbar;

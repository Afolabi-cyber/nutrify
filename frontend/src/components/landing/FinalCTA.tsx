import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate,Link } from "react-router-dom";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { fadeUp } from "@/lib/animations";

const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer className="border-t border-border bg-background">
      {/* Newsletter Bar */}
      <div className="border-b border-border py-8 px-5">
        <motion.div 
          className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div>
            <p className="text-lg font-semibold tracking-tight">GET EXCLUSIVE OFFERS!</p>
            <p className="text-sm text-muted-foreground">Subscribe to our newsletter</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="email"
              placeholder="Enter your Email"
              className="h-10 px-4 rounded-lg border border-border bg-muted text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button className="nutrify-gradient h-10 w-10 rounded-lg flex items-center justify-center text-white flex-shrink-0 hover:opacity-90 transition-all">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Main Footer */}
      <div className="py-12 px-5">
        <motion.div 
          className="container mx-auto max-w-6xl grid grid-cols-2 sm:grid-cols-4 gap-10"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Logo */}
          <div className="col-span-2 sm:col-span-1">
             <Link to="/" className="flex items-center">
            {/* Light mode logo */}
            <img
              src={logoLight}
              alt="Nutrify"
              className="h-12 w-auto block dark:hidden"
            />
            {/* Dark mode logo */}
            <img
              src={logoDark}
              alt="Nutrify"
              className="h-12 w-auto hidden dark:block"
            />
          </Link>
          </div>

          {/* Our Company */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Our Company</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Intellectual Property Policy</a></li>
            </ul>
          </div>

          {/* Take a Tour */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Take a Tour</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Payday Deals</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-sm font-semibold mb-1">+234 906-203-6555</p>
            <p className="text-xs text-primary uppercase tracking-widest mb-4">Customer Care</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tolaram Wellness Limited<br />
              44 Eric Moore Rd, Surulere,<br />
              101241, Lagos
            </p>
          </div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border py-4 px-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Nutrify. All rights reserved.
      </div>
    </footer>
  );
};

const FinalCTA = () => {
  const navigate = useNavigate();

  return (
    <>
      <section className="py-20 sm:py-28 px-5">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <h2 className="font-serif text-3xl md:text-5xl tracking-tight leading-[1.1] text-foreground mb-4">
              Start your first scan <span className="italic nutrify-gradient-text">today</span>
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto mb-8 leading-relaxed">
              Join thousands discovering what their meals are really made of.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/app")}
              className="nutrify-gradient text-primary-foreground border-0 h-12 px-8 text-sm font-medium rounded-xl nutrify-shadow hover:opacity-90 transition-all"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default FinalCTA;
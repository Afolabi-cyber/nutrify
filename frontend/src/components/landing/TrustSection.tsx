import { motion } from "framer-motion";
import { FlaskConical, Globe, ShieldCheck } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/animations";

const items = [
  {
    icon: FlaskConical,
    title: "Science-based",
    description: "Peer-reviewed databases and WHO micronutrient guidelines power every analysis.",
  },
  {
    icon: Globe,
    title: "Locally trained",
    description: "Our AI knows West African dishes — not just burgers and salads.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    description: "Your data stays yours. Encrypted, never sold, never shared.",
  },
];

const TrustSection = () => {
  return (
    <section className="py-20 sm:py-28 px-5 bg-secondary/30">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-14"
        >
          <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3 block">
            Trust & safety
          </span>
          <h2 className="font-serif text-3xl md:text-5xl tracking-tight leading-[1.1] text-foreground mb-4">
            Why trust <span className="italic nutrify-gradient-text">Nutrify</span>?
          </h2>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              className="bg-card rounded-2xl p-6 border border-border/40 text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-4.5 w-4.5 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSection;

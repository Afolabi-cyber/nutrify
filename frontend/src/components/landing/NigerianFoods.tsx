import { motion } from "framer-motion";
import jollofImg from "@/assets/jollof-plate.png";
import egusiImg from "@/assets/egusi-soup.png";
import amalaImg from "@/assets/amala.png";
import beansImg from "@/assets/beans.png";
import { fadeUp, staggerContainer } from "@/lib/animations";

const foods = [
  { name: "Jollof Rice", img: jollofImg, nutrients: "Vitamin A · Lycopene" },
  { name: "Egusi Soup", img: egusiImg, nutrients: "Protein · Iron · Zinc" },
  { name: "Amala & Ewedu", img: amalaImg, nutrients: "Fiber · Potassium" },
  { name: "Beans Porridge", img: beansImg, nutrients: "Protein · Folate" },
];

const NigerianFoods = () => {
  return (
    <section className="py-20 sm:py-28 px-5">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mb-12"
        >
          <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3 block">
            Local intelligence
          </span>
          <h2 className="font-serif text-3xl md:text-5xl tracking-tight leading-[1.1] text-foreground mb-4">
            Built for <span className="italic nutrify-gradient-text">Nigerian meals</span>
          </h2>
          <p className="text-muted-foreground max-w-md leading-relaxed">
            From jollof to amala — we understand the food you actually eat.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {foods.map((food, i) => (
            <motion.div
              key={food.name}
              variants={fadeUp}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer"
            >
              <img
                src={food.img}
                alt={food.name}
                loading="lazy"
                width={512}
                height={550}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h4 className="font-serif text-lg text-primary-foreground">{food.name}</h4>
                <p className="text-[11px] text-primary-foreground/70 mt-0.5">{food.nutrients}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default NigerianFoods;

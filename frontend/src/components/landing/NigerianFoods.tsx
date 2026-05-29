import { motion } from "framer-motion";
import jollofImg from "@/assets/jollof-plate.png";
import egusiImg from "@/assets/egusi-soup.png";
import amalaImg from "@/assets/amala.png";
import beansImg from "@/assets/beans.png";
import { fadeUp, staggerContainer } from "@/lib/animations";

const foods = [
  { name: "Jollof Rice", img: jollofImg, nutrients: "Vitamin A · Lycopene · Carbs" },
  { name: "Egusi Soup", img: egusiImg, nutrients: "Protein · Iron · Zinc" },
  { name: "Amala & Ewedu", img: amalaImg, nutrients: "Fiber · Potassium · Folate" },
  { name: "Beans Porridge", img: beansImg, nutrients: "Protein · Folate · Iron" },
  {
    name: "Pounded Yam",
    img: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=512&q=80",
    nutrients: "Carbs · Vitamin C · Potassium",
  },
  {
    name: "Suya",
    img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=512&q=80",
    nutrients: "Protein · B12 · Iron",
  },
  {
    name: "Akara",
    img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=512&q=80",
    nutrients: "Protein · Folate · Fiber",
  },
  {
    name: "Moi Moi",
    img: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=512&q=80",
    nutrients: "Protein · Folate · Phosphorus",
  },
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
            From jollof to amala, suya to moi moi — we understand the food you actually eat.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {foods.map((food) => (
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
                height={683}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                <h4 className="font-serif text-sm md:text-base text-primary-foreground">{food.name}</h4>
                <p className="text-[10px] md:text-[11px] text-primary-foreground/70 mt-0.5 leading-tight">{food.nutrients}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default NigerianFoods;

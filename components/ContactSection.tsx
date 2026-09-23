"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "./motion/variants";
import ContactPanel from "./ContactPanel";

type Props = {
  as?: "h1" | "h2";
};

export default function ContactSection({ as }: Props) {
  return (
    <section id="contact" className="border-t border-white/10 bg-black text-white">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="section-container flex justify-center"
      >
        <ContactPanel as={as} />
      </motion.div>
    </section>
  );
}

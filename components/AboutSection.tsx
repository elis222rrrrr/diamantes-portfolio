"use client";

import { motion } from "framer-motion";
import DotLine from "./DotLine";
import FramedPhoto from "./FramedPhoto";
import { fadeInUp } from "./motion/variants";

type Props = { as?: "h1" | "h2" };

export default function AboutSection({ as: Heading = "h2" }: Props) {
  return (
    <>
      <section className="bg-black text-white">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="section-container"
        >
          <DotLine label="STUDIO" side="left" className="mb-10" accent />
          <Heading className="section-heading max-w-2xl">A Creative Technology Studio</Heading>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16">
            <div className="max-w-2xl space-y-6 text-sm leading-relaxed text-muted">
              <p>
                Diamantes Designs is a creative technology studio based in Greece, where engineering
                and artistic expression meet.
              </p>
              <p>
                At the heart of the studio is one simple idea:{" "}
                <strong className="font-normal text-white">creation</strong>.
              </p>
              <p>
                We use 3D technologies as creative tools to transform ideas into tangible
                experiences. By bringing together CAD engineering in Fusion 360, digital sculpting
                and rendering in Blender, digital garment design in CLO3D, and experimental design
                within one studio, we bridge technical precision with creative exploration.
              </p>
              <p>
                Rather than separating engineering from design, we believe the strongest ideas
                emerge when both disciplines work together. Every project is approached with equal
                attention to functionality, aesthetics, and innovation.
              </p>
            </div>

            <FramedPhoto
              src="/about/me-with-project.jpg"
              alt="Elisavet, founder of Diamantes Designs, at her first exhibition"
              caption="First exhibition"
              aspect="1206/1519"
              className="lg:ml-auto"
            />
          </div>
        </motion.div>
      </section>

      <section className="border-t border-white/10 bg-black text-white">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="section-container"
        >
          <DotLine label="SUSTAINABILITY" side="left" className="mb-10" />
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <h2 className="section-heading max-w-md">Sustainability by design.</h2>

            <div className="max-w-2xl space-y-6 text-sm leading-relaxed text-muted">
              <p>
                Sustainability is part of how we design, not an afterthought. We are working toward
                a zero-waste studio by producing to order and making only what is needed.
              </p>
              <p>
                Where the object and its performance allow it, we choose lower-impact and recycled
                materials, reuse production remnants, and keep refining our methods as better
                options become available.
              </p>
              <div className="grid gap-6 border-y border-white/10 py-8 sm:grid-cols-3 sm:divide-x sm:divide-white/10">
                <div className="sm:pr-6">
                  <p className="tracked-label text-white/50">01 / MAKE</p>
                  <p className="mt-2 text-sm text-white">Only what is needed.</p>
                </div>
                <div className="sm:px-6">
                  <p className="tracked-label text-white/50">02 / REUSE</p>
                  <p className="mt-2 text-sm text-white">Material stays in the process.</p>
                </div>
                <div className="sm:pl-6">
                  <p className="tracked-label text-white/50">03 / REFINE</p>
                  <p className="mt-2 text-sm text-white">Better choices over time.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="border-t border-white/10 bg-black text-white">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="section-container"
        >
          <DotLine label="ORIGIN" side="left" className="mb-10" />
          <h2 className="section-heading max-w-2xl">Our Story</h2>

          <div className="mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
            <FramedPhoto
              src="/about/grandma.jpg"
              alt="A young Elisavet with her grandmother, after whom Diamantes Designs is named"
              caption="My grandmother and me"
              aspect="1086/1448"
            />

            <div className="max-w-2xl space-y-6 text-sm leading-relaxed text-muted">
              <p>Nothing exists without roots.</p>
              <p>
                The name <strong className="font-normal text-white">Diamantes</strong> is inspired
                by my family name, Diamantopoulos, and is a tribute to the woman who raised me, my
                grandmother. She taught me that meaningful work begins with strong foundations,
                patience, and dedication.
              </p>
              <p>The direction of the studio comes from the way I have always seen the world.</p>
              <p>
                Growing up, I never understood why technology and art were treated as completely
                different disciplines. To me, they have always followed the same creative process:
              </p>

              <p className="tracked-label !mt-10 text-white/70">
                Idea <span className="text-white/30">→</span> Development{" "}
                <span className="text-white/30">→</span> Experimentation{" "}
                <span className="text-white/30">→</span> Creation
              </p>

              <p className="!mt-10">The only difference is their focus.</p>

              <div className="grid gap-6 border-y border-white/10 py-8 sm:grid-cols-2 sm:divide-x sm:divide-white/10">
                <div className="sm:pr-6">
                  <p className="tracked-label text-white/50">Engineering</p>
                  <p className="mt-2 text-sm text-white">asks how something works.</p>
                </div>
                <div className="sm:pl-6">
                  <p className="tracked-label text-white/50">Design</p>
                  <p className="mt-2 text-sm text-white">asks how something feels.</p>
                </div>
              </div>

              <p>
                One is driven by function, the other by emotion, yet both rely on curiosity,
                iteration, and problem-solving.
              </p>
              <p>
                Diamantes Designs was created to unite these two worlds. It is a place where
                technical knowledge meets artistic vision, allowing ideas to become objects,
                experiences, and stories through digital creation.
              </p>

              <p className="!mt-10 text-xl font-light leading-snug text-white lg:text-2xl">
                For us, technology is another artistic medium, and creativity is another form of
                engineering.
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
}

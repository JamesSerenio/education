import { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from "@ionic/react";
import { motion, AnimatePresence } from "framer-motion";

// ✅ Import images
import discoverImg from "../../assets/who_discover_arithmetic.png";

// a₁ (multiple images)
import a1_1 from "../../assets/A1-1.png";
import a1_2 from "../../assets/A1-2.png";
import a1_3 from "../../assets/A1-3.png";
import a1_4 from "../../assets/A1-4.png";

// an images
import an1Img from "../../assets/An-1.png";
import an2Img from "../../assets/An-2.png";
import an3Img from "../../assets/An-3.png";
import an4Img from "../../assets/An-4.png";

// d images
import d1Img from "../../assets/d-1.png";
import d2Img from "../../assets/d-2.png";
import d3Img from "../../assets/d-3.png";

const Arithmetic_Module: React.FC = () => {
  const [selected, setSelected] = useState<string>("a1");

  // ✅ Centralized image controller
  const images: Record<string, { src: string | string[]; label: string }> = {
    a1: {
      src: [a1_1, a1_2, a1_3, a1_4],
      label: "Find a₁ (scroll to view more)",
    },
    d: {
      src: [d1Img, d2Img, d3Img],
      label: "Find d (scroll to view more)",
    },
    an: {
      src: [an1Img, an2Img, an3Img, an4Img],
      label: "Find an (scroll to view more)",
    },
  };

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.3, delayChildren: 0.2 }}
          className="arithmetic-module-container"
        >
          {/* ✅ CARD 1 — Who Discovered Arithmetic */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="arithmetic-card"
          >
            <h3>Who Discovered Arithmetic</h3>
            <motion.img
              src={discoverImg}
              alt="Who Discover Arithmetic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            />
          </motion.div>

          {/* ✅ CARD 2 — Arithmetic Module */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            className="arithmetic-card"
          >
            <h3>Module for Arithmetic Sequence</h3>

            {/* Segment Tabs */}
            <IonSegment
              value={selected}
              onIonChange={(e) => setSelected(e.detail.value as string)}
              scrollable
            >
              <IonSegmentButton value="a1">
                <IonLabel>a₁</IonLabel>
              </IonSegmentButton>

              <IonSegmentButton value="d">
                <IonLabel>d</IonLabel>
              </IonSegmentButton>

              <IonSegmentButton value="an">
                <IonLabel>aₙ</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {/* ✅ SCROLLABLE IMAGE VIEWER */}
            <div className="image-scroll-container">
              <AnimatePresence mode="wait">
                {Array.isArray(images[selected].src) ? (
                  <motion.div
                    key={`${selected}-list`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {(images[selected].src as string[]).map((img, index) => (
                      <motion.img
                        key={index}
                        src={img}
                        alt={`${selected}-${index}`}
                        initial={{ scale: 0.96 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.4 }}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.img
                    key={selected}
                    src={images[selected].src as string}
                    alt={images[selected].label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </IonContent>
    </IonPage>
  );
};

export default Arithmetic_Module;

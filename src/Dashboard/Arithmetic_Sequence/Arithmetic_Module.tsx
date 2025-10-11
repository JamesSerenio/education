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

// Import images
import anImg from "../../assets/an_arithmetic.png";
import discoverImg from "../../assets/who_discover_arithmetic.png";
import a1Img from "../../assets/a1_arithmetic.png";
import dImg from "../../assets/d_arithmetic.png";
import nImg from "../../assets/n_arithmetic.png";

const Arithmetic_Module: React.FC = () => {
  const [selected, setSelected] = useState<string>("module");

  const images: Record<string, { src: string; label: string }> = {
    module: { src: anImg, label: "An Formula" },
    a1: { src: a1Img, label: "Find a₁" },
    d: { src: dImg, label: "Find d" },
    n: { src: nImg, label: "Find n" },
  };

  return (
    <IonPage>
      <IonHeader></IonHeader>
      <IonContent fullscreen>
        {/* Container with staggered fade-in */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.3, delayChildren: 0.2 }}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: "20px",
            padding: "20px",
            flexWrap: "wrap",
          }}
        >
          {/* Card 1: Who Discovered Arithmetic */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              border: "2px solid #ccc",
              borderRadius: "10px",
              padding: "10px",
              textAlign: "center",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              flex: "1 1 300px",
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>Who Discovered Arithmetic</h3>
            <motion.img
              src={discoverImg}
              alt="Who Discover Arithmetic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              style={{ width: "100%", borderRadius: "8px" }}
            />
          </motion.div>

          {/* Card 2: Arithmetic Module */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            style={{
              border: "2px solid #ccc",
              borderRadius: "10px",
              padding: "10px",
              textAlign: "center",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              flex: "1 1 300px",
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>
              Module for Arithmetic Sequence
            </h3>

            <IonSegment
              value={selected}
              onIonChange={(e) => setSelected(e.detail.value as string)}
              scrollable
            >
              <IonSegmentButton value="module">
                <IonLabel>
                  A<sub>n</sub>
                </IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="a1">
                <IonLabel>
                  a<sub>1</sub>
                </IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="d">
                <IonLabel>d</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="n">
                <IonLabel>n</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {/* Image transition on tab change */}
            <div style={{ marginTop: "15px", position: "relative" }}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={selected}
                  src={images[selected].src}
                  alt={images[selected].label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    position: "relative",
                  }}
                />
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </IonContent>
    </IonPage>
  );
};

export default Arithmetic_Module;

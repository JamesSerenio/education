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
import discoverImg from "../../assets/who_discover_arithmetic.png";

// ✅ Multiple a1 images
import a1_1 from "../../assets/A1-1.png";
import a1_2 from "../../assets/A1-2.png";
import a1_3 from "../../assets/A1-3.png";
import a1_4 from "../../assets/A1-4.png";

// ✅ Multiple images for An
import an1Img from "../../assets/An-1.png";
import an2Img from "../../assets/An-2.png";
import an3Img from "../../assets/An-3.png";
import an4Img from "../../assets/An-4.png";

// ✅ Multiple images for d
import d1Img from "../../assets/d-1.png";
import d2Img from "../../assets/d-2.png";
import d3Img from "../../assets/d-3.png";

const Arithmetic_Module: React.FC = () => {
  const [selected, setSelected] = useState<string>("a1");

  // Updated all segments to support multiple images
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
      <IonHeader></IonHeader>
      <IonContent fullscreen>
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

            {/* Scrollable image container */}
            <div
              style={{
                marginTop: "15px",
                position: "relative",
                maxHeight: "400px",
                overflowY: "auto",
                borderRadius: "8px",
              }}
            >
              <AnimatePresence mode="wait">
                {Array.isArray(images[selected].src) ? (
                  <motion.div
                    key={`${selected}-scroll`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {(images[selected].src as string[]).map((img, index) => (
                      <motion.img
                        key={index}
                        src={img}
                        alt={`${selected} image ${index + 1}`}
                        style={{ width: "100%", borderRadius: "8px" }}
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
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    style={{
                      width: "100%",
                      borderRadius: "8px",
                      position: "relative",
                    }}
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

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
import discoverImg from "../../assets/who_discover_motion.png";

// Velocity images
import velocity1 from "../../assets/velocity-1.png";
import velocity2 from "../../assets/velocity-2.png";
import velocity3 from "../../assets/velocity-3.png";
import velocity4 from "../../assets/velocity-4.png";

// Time images
import time1 from "../../assets/time-1.png";
import time2 from "../../assets/time-2.png";
import time3 from "../../assets/time-3.png";
import time4 from "../../assets/time-4.png";

// Distance images
import distance1 from "../../assets/distance-1.png";
import distance2 from "../../assets/distance-2.png";
import distance3 from "../../assets/distance-3.png";
import distance4 from "../../assets/distance-4.png";

const Motion_Module: React.FC = () => {
  const [selected, setSelected] = useState<string>("velocity");

  const images: Record<string, { src: string; label: string }[]> = {
    velocity: [
      { src: velocity1, label: "Velocity 1" },
      { src: velocity2, label: "Velocity 2" },
      { src: velocity3, label: "Velocity 3" },
      { src: velocity4, label: "Velocity 4" },
    ],
    time: [
      { src: time1, label: "Time 1" },
      { src: time2, label: "Time 2" },
      { src: time3, label: "Time 3" },
      { src: time4, label: "Time 4" },
    ],
    distance: [
      { src: distance1, label: "Distance 1" },
      { src: distance2, label: "Distance 2" },
      { src: distance3, label: "Distance 3" },
      { src: distance4, label: "Distance 4" },
    ],
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
            flexDirection: "column",
            alignItems: "center",
            padding: "20px",
            gap: "20px",
          }}
        >
          {/* Who Discovered Motion */}
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
              maxWidth: "500px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>Who Discovered Motion</h3>
            <motion.img
              src={discoverImg}
              alt="Who Discover Motion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              style={{ width: "100%", borderRadius: "8px" }}
            />
          </motion.div>

          {/* Motion Module */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            style={{
              border: "2px solid #ccc",
              borderRadius: "10px",
              padding: "10px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>Uniform Motion Module</h3>

            <IonSegment
              value={selected}
              onIonChange={(e) => setSelected(e.detail.value as string)}
              scrollable
            >
              <IonSegmentButton value="velocity">
                <IonLabel>Velocity</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="time">
                <IonLabel>Time</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="distance">
                <IonLabel>Distance</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {/* Scrollable images */}
            <div
              style={{
                marginTop: "15px",
                maxHeight: "400px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              <AnimatePresence mode="wait">
                {images[selected].map((img) => (
                  <motion.img
                    key={img.src}
                    src={img.src}
                    alt={img.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    style={{ width: "100%", borderRadius: "8px" }}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </IonContent>
    </IonPage>
  );
};

export default Motion_Module;

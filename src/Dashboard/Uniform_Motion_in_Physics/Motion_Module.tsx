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

  // Centralized image controller
  const images: Record<string, { src: string[]; label: string }> = {
    velocity: { src: [velocity1, velocity2, velocity3, velocity4], label: "Velocity" },
    time: { src: [time1, time2, time3, time4], label: "Time" },
    distance: { src: [distance1, distance2, distance3, distance4], label: "Distance" },
  };

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.3, delayChildren: 0.2 }}
          className="motion-module-container"
        >
          {/* CARD 1 — Who Discovered Motion */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="motion-card"
          >
            <h3>Who Discovered Motion</h3>
            <motion.img
              src={discoverImg}
              alt="Who Discover Motion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            />
          </motion.div>

          {/* CARD 2 — Motion Module */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            className="motion-card"
          >
            <h3>Uniform Motion Module</h3>

            {/* Segment Tabs */}
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

            {/* Scrollable Image Viewer */}
            <div className="image-scroll-container">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selected}-list`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  style={{ display: "flex", flexDirection: "column", gap: "12px" }}
                >
                  {images[selected].src.map((img, index) => (
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
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </IonContent>
    </IonPage>
  );
};

export default Motion_Module;

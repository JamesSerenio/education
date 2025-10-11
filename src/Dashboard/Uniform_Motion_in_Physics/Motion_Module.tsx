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
import velocityImg from "../../assets/velocity_motion.png";
import discoverImg from "../../assets/who_discover_motion.png";
import timeImg from "../../assets/time_motion.png";
import distanceImg from "../../assets/distance_motion.png";

const Motion_Module: React.FC = () => {
  const [selected, setSelected] = useState<string>("velocity");

  const images: Record<string, { src: string; label: string }> = {
    velocity: { src: velocityImg, label: "Velocity" },
    time: { src: timeImg, label: "Time" },
    distance: { src: distanceImg, label: "Distance" },
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
          {/* Card 1: Who Discovered Motion */}
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

          {/* Card 2: Motion Module */}
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

export default Motion_Module;

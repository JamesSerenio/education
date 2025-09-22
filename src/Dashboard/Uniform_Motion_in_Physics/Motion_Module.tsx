import { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from "@ionic/react";

// Import images from src/assets
import velocityImg from "../../assets/velocity_motion.png";
import discoverImg from "../../assets/who_discover_motion.png";
import timeImg from "../../assets/time_motion.png";
import distanceImg from "../../assets/distance_motion.png";

const Motion_Module: React.FC = () => {
  // State para sa selected tab
  const [selected, setSelected] = useState<string>("velocity");

  // Mapping ng images
  const images: Record<string, { src: string; label: string }> = {
    velocity: { src: velocityImg, label: "Velocity" },
    time: { src: timeImg, label: "Time" },
    distance: { src: distanceImg, label: "Distance" },
  };

  return (
    <IonPage>
      <IonHeader></IonHeader>
      <IonContent fullscreen>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: "20px",
            padding: "20px",
            flexWrap: "wrap",
          }}
        >
          {/* Who Discover Motion (first) */}
          <div
            style={{
              border: "2px solid #ccc",
              borderRadius: "10px",
              padding: "10px",
              textAlign: "center",
              width: "45%",
              maxWidth: "400px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>Who Discovered Motion</h3>
            <img
              src={discoverImg}
              alt="Who Discover Motion"
              style={{ width: "100%", borderRadius: "8px" }}
            />
          </div>

          {/* Motion Module with switch */}
          <div
            style={{
              border: "2px solid #ccc",
              borderRadius: "10px",
              padding: "10px",
              textAlign: "center",
              width: "45%",
              maxWidth: "400px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>Uniform Motion Module</h3>

            {/* Switch Tabs */}
            <IonSegment
              value={selected}
              onIonChange={(e) => setSelected(e.detail.value as string)}
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

            {/* Display selected image */}
            <div style={{ marginTop: "15px" }}>
              <img
                src={images[selected].src}
                alt={images[selected].label}
                style={{ width: "100%", borderRadius: "8px" }}
              />
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Motion_Module;

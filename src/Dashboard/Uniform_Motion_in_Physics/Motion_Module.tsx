import {
  IonPage,
  IonHeader,
  IonContent,
} from "@ionic/react";

// Import images from src/assets
import moduleImg from "../../assets/motion_module.png";
import discoverImg from "../../assets/who_discover_motion.png";

const Motion_Module: React.FC = () => {
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
            <h3 style={{ marginBottom: "10px" }}>Who Discovered Arithmetic</h3>
            <img
              src={discoverImg}
              alt="Who Discover Arithmetic"
              style={{ width: "100%", borderRadius: "8px" }}
            />
          </div>

          {/* Motion Module (second) */}
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
            <h3 style={{ marginBottom: "10px" }}>Arithmetic Module</h3>
            <img
              src={moduleImg}
              alt="Arithmetic Module"
              style={{ width: "100%", borderRadius: "8px" }}
            />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Motion_Module;

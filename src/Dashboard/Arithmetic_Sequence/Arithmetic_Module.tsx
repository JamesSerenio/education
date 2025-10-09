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
import anImg from "../../assets/an_arithmetic.png";
import discoverImg from "../../assets/who_discover_arithmetic.png";
import a1Img from "../../assets/a1_arithmetic.png";
import dImg from "../../assets/d_arithmetic.png";
import nImg from "../../assets/n_arithmetic.png";

const Arithmetic_Module: React.FC = () => {
  // Default tab: An
  const [selected, setSelected] = useState<string>("module");

  // Mapping ng images
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
          {/* Who Discover Arithmetic (first) */}
          <div
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
            <img
              src={discoverImg}
              alt="Who Discover Arithmetic"
              style={{ width: "100%", borderRadius: "8px" }}
            />
          </div>

          {/* Arithmetic Module with switch */}
          <div
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
            <h3 style={{ marginBottom: "10px" }}>Module for Arithmetic Sequence</h3>

            {/* Switch Tabs with scrollable option */}
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

export default Arithmetic_Module;

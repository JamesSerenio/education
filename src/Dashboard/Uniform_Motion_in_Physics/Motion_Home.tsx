import {
  IonContent,
  IonPage,
  IonButton,
} from "@ionic/react";
import { useState } from "react";
import MotionPractice from "./Motion_Practice"; // import mo yung file

const Motion_Home: React.FC = () => {
  const [showPractice, setShowPractice] = useState(false);

  const handleStartQuiz = () => {
    setShowPractice(true); // instead of redirect, show the practice component
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        {!showPractice ? (
          // 👉 Start button screen
          <div
            style={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#f8f9fa",
            }}
          >
            <IonButton
              expand="block"
              size="large"
              color="primary"
              onClick={handleStartQuiz}
              style={{
                maxWidth: "250px",
                textTransform: "none",
                padding: "20px 10px",
              }}
            >
              <div style={{ textAlign: "center", lineHeight: "1.2" }}>
                <div style={{ fontSize: "25px", fontWeight: "bold" }}>Start</div>
                <div style={{ fontSize: "25px", fontWeight: "bold" }}>The Quiz</div>
              </div>
            </IonButton>
          </div>
        ) : (
          // 👉 Show Arithmetic Practice directly here
          <MotionPractice />
        )}
      </IonContent>
    </IonPage>
  );
};

export default Motion_Home;

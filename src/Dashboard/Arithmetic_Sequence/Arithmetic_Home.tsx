import React, { useState } from "react";
import { IonContent, IonPage, IonButton } from "@ionic/react";
import { motion } from "framer-motion";
import Arithmetic_Practice from "./Arithmetic_Practice";

const Arithmetic_Home: React.FC = () => {
  const [showPractice, setShowPractice] = useState(false);

  const handleStartQuiz = () => setShowPractice(true);

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
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
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
            </motion.div>
          </div>
        ) : (
          // 👉 Show Arithmetic Practice directly
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Arithmetic_Practice />
          </motion.div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Arithmetic_Home;

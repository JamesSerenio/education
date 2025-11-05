import { IonContent, IonPage, IonButton } from "@ionic/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Arithmetic_Practice from "./Arithmetic_Practice";

const Arithmetic_Home: React.FC = () => {
  const [showPractice, setShowPractice] = useState(false);

  const handleStartQuiz = () => {
    setShowPractice(true);
  };

  return (
    <IonPage>
      {/* ✅ Disable scrolling by setting scrollY={false} */}
      <IonContent fullscreen scrollY={false}>
        <div className="home-center-wrapper">
          <AnimatePresence mode="wait">
            {!showPractice ? (
              <motion.div
                key="start"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="start-quiz-screen"
              >
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="quiz-intro"
                >
                  <h1 className="quiz-title">Arithmetic Practice</h1>
                  <p className="quiz-subtitle">
                    Ready to test your math skills? Let’s begin your journey!
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 250 }}
                >
                  <IonButton
                    expand="block"
                    size="large"
                    className="start-quiz-button"
                    onClick={handleStartQuiz}
                  >
                    <div className="start-button-text">
                      <div>Start</div>
                      <div>The Quiz</div>
                    </div>
                  </IonButton>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="practice"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Arithmetic_Practice />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Arithmetic_Home;

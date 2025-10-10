import {
  IonPage,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { motion } from "framer-motion"; // ✅ Added for animation

const Home: React.FC = () => {
  const history = useHistory();

  const handleNavigate = (path: string) => {
    history.push(path);
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            textAlign: "center",
            marginTop: "1rem",
          }}
        >
          <h1 style={{ fontWeight: "bold", fontSize: "1.8rem" }}>
            Welcome to Learning Dashboard
          </h1>
          <p>Choose a topic to get started!</p>
        </motion.div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            flexWrap: "wrap",
            marginTop: "2rem",
          }}
        >
          {/* ✅ Arithmetic Sequence Card with Animation */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <IonCard style={{ flex: "1 1 300px", maxWidth: "400px" }}>
              <IonCardHeader>
                <IonCardTitle>Arithmetic Sequence</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>Explore the properties and problems of arithmetic sequences.</p>
                <IonButton
                  expand="block"
                  onClick={() => handleNavigate("/education/dashboard_arithmetic")}
                >
                  Start
                </IonButton>
              </IonCardContent>
            </IonCard>
          </motion.div>

          {/* ✅ Uniform Motion in Physics Card with Animation */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <IonCard style={{ flex: "1 1 300px", maxWidth: "400px" }}>
              <IonCardHeader>
                <IonCardTitle>Uniform Motion in Physics</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>Learn about uniform motion concepts and calculations.</p>
                <IonButton
                  expand="block"
                  onClick={() => handleNavigate("/education/dashboard_motion")}
                >
                  Start
                </IonButton>
              </IonCardContent>
            </IonCard>
          </motion.div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;

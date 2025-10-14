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
import { motion } from "framer-motion";
import logoutGif from "../assets/logout.gif";

const Home: React.FC = () => {
  const history = useHistory();

  // ✅ Navigate function
  const handleNavigate = (path: string) => {
    history.push(path);
  };

  // ✅ Logout function (same style as your example)
  const handleLogout = () => {
    history.push("/education/login");
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding" style={{ position: "relative" }}>
        {/* ✅ Animated Logout Button (Top-right corner) */}
        <motion.div
          initial={{ opacity: 0, x: 20, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            position: "absolute",
            top: "15px",
            right: "20px",
            cursor: "pointer",
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <IonButton fill="clear" onClick={handleLogout} style={{ padding: 0, minWidth: "auto" }}>
            <img
              src={logoutGif}
              alt="Logout"
              style={{
                width: "45px",
                height: "45px",
                objectFit: "contain",
                borderRadius: "0",
                boxShadow: "none",
              }}
            />
          </IonButton>
        </motion.div>

        {/* ✅ Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          style={{
            textAlign: "center",
            marginTop: "3rem",
          }}
        >
          <h1 style={{ fontWeight: "bold", fontSize: "1.8rem" }}>
            Welcome to Learning Dashboard
          </h1>
          <p>Choose a topic to get started!</p>
        </motion.div>

        {/* ✅ Cards Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "stretch",
            gap: "1.5rem",
            flexWrap: "wrap",
            marginTop: "2.5rem",
          }}
        >
          {/* Arithmetic Sequence */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{ flex: "1 1 350px", maxWidth: "400px" }}
          >
            <IonCard
              style={{
                height: "100%",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <IonCardHeader>
                <IonCardTitle>Arithmetic Sequence</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>
                  Explore the properties and problems of arithmetic sequences.
                </p>
                <IonButton
                  expand="block"
                  color="primary"
                  onClick={() => handleNavigate("/education/dashboard_arithmetic")}
                >
                  Start
                </IonButton>
              </IonCardContent>
            </IonCard>
          </motion.div>

          {/* Uniform Motion in Physics */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            style={{ flex: "1 1 350px", maxWidth: "400px" }}
          >
            <IonCard
              style={{
                height: "100%",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <IonCardHeader>
                <IonCardTitle>Uniform Motion in Physics</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>Learn about uniform motion concepts and calculations.</p>
                <IonButton
                  expand="block"
                  color="primary"
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

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
import "./Home.css"; // 🟢 Import CSS file

const Home: React.FC = () => {
  const history = useHistory();

  const handleNavigate = (path: string) => history.push(path);
  const handleLogout = () => history.push("/login");

  return (
    <IonPage>
      <IonContent fullscreen scrollY={false} className="auth-bg">
        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, x: 20, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="logout-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <IonButton fill="clear" onClick={handleLogout} className="logout-btn-inner">
            <img src={logoutGif} alt="Logout" className="logout-icon" />
          </IonButton>
        </motion.div>

        {/* Main Content */}
        <div className="dashboard-wrapper">
          <div className="dashboard-container">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="auth-title"
            >
              Welcome to Learning Dashboard
            </motion.h1>

            <p className="dashboard-subtitle">Choose a topic to get started!</p>

            {/* Cards Grid */}
            <div className="dashboard-grid">
              {/* Arithmetic Sequence (Green Theme) */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                whileHover={{ scale: 1.05 }}
              >
                <IonCard className="dashboard-ion-card green-card">
                  <IonCardHeader>
                    <IonCardTitle>Arithmetic Sequence</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p>
                      Explore the properties and problems of arithmetic
                      sequences.
                    </p>
                    <IonButton
                      expand="block"
                      color="success"
                      onClick={() => handleNavigate("/dashboard_arithmetic")}
                    >
                      START
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </motion.div>

              {/* Uniform Motion in Physics (Yellow Theme) */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                whileHover={{ scale: 1.05 }}
              >
                <IonCard className="dashboard-ion-card yellow-card">
                  <IonCardHeader>
                    <IonCardTitle>Uniform Motion in Physics</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p>Learn about uniform motion concepts and calculations.</p>
                    <IonButton
                      expand="block"
                      color="warning"
                      onClick={() => handleNavigate("/dashboard_motion")}
                    >
                      START
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </motion.div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;

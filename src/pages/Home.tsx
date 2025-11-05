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

  const handleNavigate = (path: string) => history.push(path);
  const handleLogout = () => history.push("/login");

  return (
    <IonPage>
      <IonContent fullscreen scrollY={false} className="auth-bg">
        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, x: 20, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="logout-btn"
        >
          <IonButton fill="clear" onClick={handleLogout} className="logout-btn-inner">
            <img src={logoutGif} alt="Logout" className="logout-icon" />
          </IonButton>
        </motion.div>

        {/* Main Content */}
        <div className="dashboard-wrapper">
          <motion.div
            className="dashboard-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="auth-title">Welcome to Learning Dashboard</h1>
            <p className="dashboard-subtitle">Choose a topic to get started!</p>

            {/* Cards Grid */}
            <div className="dashboard-grid">
              {/* Arithmetic Sequence (Light Green Theme) */}
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <IonCard className="dashboard-ion-card green-card">
                  <IonCardHeader>
                    <IonCardTitle>Arithmetic Sequence</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p>
                      Explore the properties and problems of arithmetic sequences.
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

              {/* Uniform Motion in Physics (Canary Yellow Theme) */}
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
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
          </motion.div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;

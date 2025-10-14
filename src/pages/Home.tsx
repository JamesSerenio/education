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
import { useEffect, useState } from "react";
import logoutGif from "../assets/logout.gif";

const Home: React.FC = () => {
  const history = useHistory();
  const [symbols, setSymbols] = useState<
    { symbol: string; x: number; y: number; size: number; delay: number }[]
  >([]);

  const mathSymbols = [
    "+", "-", "×", "÷", "=", "%", "√", "π", "Σ",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "distance", "velocity", "displacement", "speed",
    "a₁", "d", "n", "aₙ",
  ];

  useEffect(() => {
    const newSymbols = Array.from({ length: 25 }).map(() => ({
      symbol: mathSymbols[Math.floor(Math.random() * mathSymbols.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 8,
    }));
    setSymbols(newSymbols);
  }, []);

  const handleNavigate = (path: string) => history.push(path);
  const handleLogout = () => history.push("/education/login");

  return (
    <IonPage>
      <IonContent fullscreen scrollY={false} className="auth-bg">
        {/* Floating Symbols */}
        {symbols.map((s, i) => (
          <motion.div
            key={i}
            className="floating-symbol"
            initial={{ opacity: 0, y: s.y }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              y: [s.y, s.y - 15, s.y],
            }}
            transition={{
              duration: 6 + s.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              fontSize: `${s.size}rem`,
              position: "absolute",
            }}
          >
            {s.symbol}
          </motion.div>
        ))}

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, x: 20, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            position: "absolute",
            top: "15px",
            right: "20px",
            zIndex: 10,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <IonButton fill="clear" onClick={handleLogout} style={{ padding: 0, minWidth: "auto" }}>
            <img
              src={logoutGif}
              alt="Logout"
              style={{ width: "45px", height: "45px", objectFit: "contain" }}
            />
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

            <p className="dashboard-subtitle">
              Choose a topic to get started!
            </p>

            {/* Cards Grid */}
            <div className="dashboard-grid">
              {/* Arithmetic Sequence */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                whileHover={{ scale: 1.05 }}
              >
                <IonCard className="dashboard-ion-card">
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
                      START
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </motion.div>

              {/* Uniform Motion in Physics */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                whileHover={{ scale: 1.05 }}
              >
                <IonCard className="dashboard-ion-card">
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

import React, { useState } from "react";
import {
  IonButtons,
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonMenu,
  IonMenuButton,
  IonMenuToggle,
  IonPage,
  IonSplitPane,
  IonTitle,
  IonToolbar,
  IonIcon,
} from "@ionic/react";
import { logOutOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // ✅ Animation library

// ✅ Import your page components
import AdminHome from "./admin_home";
import AdminAddQuiz from "./admin_addquiz";
import AdminLeaderboard from "./admin_leaderboard";
import AdminRadar from "./admin_radar";
import AdminArithmeticQuiz from "./admin_arithmetic_quiz";
import AdminMotionQuiz from "./admin_motion_quiz";

// ✅ Import custom icons
import iconHome from "../assets/icon_home.gif";
import iconAddQuiz from "../assets/icon_addquiz.gif";
import iconArithmetic from "../assets/icon_arithmetic.gif";
import iconMotion from "../assets/icon_motion.gif";
import iconLeaderboard from "../assets/icon_leaderboard.gif";
import iconRadar from "../assets/icon_radar.png";

const AdminDashboard: React.FC = () => {
  const history = useHistory();
  const [activePage, setActivePage] = useState("Home");

  const menuItems = [
    { name: "Home", key: "Home", icon: iconHome },
    { name: "Add Quiz", key: "quiz", icon: iconAddQuiz },
    { name: "Arithmetic Quiz", key: "arithmetic_quiz", icon: iconArithmetic },
    { name: "Motion Quiz", key: "motion_quiz", icon: iconMotion },
    { name: "Leaderboard", key: "leaderboard", icon: iconLeaderboard },
    { name: "Radar", key: "radar", icon: iconRadar },
  ];

  // ✅ Switch between dashboard content
  const renderContent = () => {
    switch (activePage) {
      case "Home":
        return <AdminHome />;
      case "quiz":
        return <AdminAddQuiz />;
      case "arithmetic_quiz":
        return <AdminArithmeticQuiz />;
      case "motion_quiz":
        return <AdminMotionQuiz />;
      case "leaderboard":
        return <AdminLeaderboard />;
      case "radar":
        return <AdminRadar />;
      default:
        return <h2 style={{ padding: "1rem" }}>Welcome to Admin Dashboard</h2>;
    }
  };

  // ✅ Animation settings
  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -25 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <IonPage>
      <IonSplitPane contentId="main" when="(min-width: 768px)">
        {/* ✅ Animated Side Menu */}
        <IonMenu contentId="main">
          <IonHeader>
            <IonToolbar>
              <IonTitle>Menu</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent>
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ paddingTop: "1rem" }}
            >
              {menuItems.map((item, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <IonMenuToggle autoHide={false}>
                    <IonItem
                      button
                      onClick={() => setActivePage(item.key)}
                      lines="none"
                    >
                      <img
                        src={item.icon}
                        alt={item.name}
                        style={{
                          width: "24px",
                          height: "24px",
                          marginRight: "8px",
                          borderRadius: "4px",
                        }}
                      />
                      <span
                        style={{
                          marginLeft: "8px",
                          position: "relative",
                          paddingBottom: "4px",
                        }}
                      >
                        {item.name}
                        {activePage === item.key && (
                          <span
                            style={{
                              position: "absolute",
                              left: 0,
                              bottom: 0,
                              width: "100%",
                              height: "2px",
                              backgroundColor: "#3b82f6",
                              borderRadius: "2px",
                            }}
                          />
                        )}
                      </span>
                    </IonItem>
                  </IonMenuToggle>
                </motion.div>
              ))}

              {/* ✅ Animated Logout Button */}
              <motion.div variants={itemVariants} style={{ marginTop: "1rem" }}>
                <IonMenuToggle autoHide={false}>
                  <IonButton
                    expand="block"
                    color="primary"
                    onClick={() => history.push("/login")}
                  >
                    <IonIcon icon={logOutOutline} slot="start" />
                    Logout
                  </IonButton>
                </IonMenuToggle>
              </motion.div>
            </motion.div>
          </IonContent>
        </IonMenu>

        {/* ✅ Animated Main Content */}
        <IonPage id="main">
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonMenuButton />
              </IonButtons>
              <IonTitle>
                {menuItems.find((m) => m.key === activePage)?.name ||
                  "Admin Dashboard"}
              </IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </IonContent>
        </IonPage>
      </IonSplitPane>
    </IonPage>
  );
};

export default AdminDashboard;

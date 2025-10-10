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
import { motion, AnimatePresence } from "framer-motion"; // ✅ Animation

import MotionHome from "./Motion_Home";
import MotionModule from "./Motion_Module";
import MotionLeaderboard from "./Motion_Leaderboard";
import MotionRadar from "./Motion_Radar";

// ✅ Custom icons
import iconHome from "../../assets/icon_home.gif";
import iconModule from "../../assets/icon_module.gif";
import iconLeaderboard from "../../assets/icon_leaderboard.gif";
import iconRadar from "../../assets/icon_radar.png";

const Dashboard_Motion: React.FC = () => {
  const history = useHistory();
  const [activePage, setActivePage] = useState("Home");

  const menuItems = [
    { name: "Home", key: "Home", icon: iconHome },
    { name: "Module", key: "module", icon: iconModule },
    { name: "Leaderboard", key: "leaderboard", icon: iconLeaderboard },
    { name: "Radar", key: "radar", icon: iconRadar },
  ];

  const renderContent = () => {
    switch (activePage) {
      case "Home":
        return <MotionHome />;
      case "module":
        return <MotionModule />;
      case "leaderboard":
        return <MotionLeaderboard />;
      case "radar":
        return <MotionRadar />;
      default:
        return (
          <h2 style={{ textAlign: "center", marginTop: "2rem" }}>
            Welcome to Motion Dashboard
          </h2>
        );
    }
  };

  // ✅ Animation variants
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
                          borderRadius: "4px",
                          marginRight: "8px",
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

              {/* ✅ Logout Button Animation */}
              <motion.div variants={itemVariants} style={{ marginTop: "1rem" }}>
                <IonMenuToggle autoHide={false}>
                  <IonButton
                    expand="block"
                    color="primary"
                    onClick={() => history.push("/education/home")}
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
                  "Dashboard Motion"}
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

export default Dashboard_Motion;

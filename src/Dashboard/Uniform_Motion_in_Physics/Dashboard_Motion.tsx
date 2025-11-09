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
import { motion, AnimatePresence } from "framer-motion";

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
        return <h2 className="arithmetic-welcome">Welcome to Motion Dashboard</h2>;
    }
  };

  // Animation variants
  const listVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -25 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <IonPage>
      <IonSplitPane contentId="main" when="(min-width: 768px)">
        {/* Sidebar Menu */}
        <IonMenu contentId="main" className="arithmetic-menu">
          <IonHeader>
            <IonToolbar className="menu-toolbar">
              <IonTitle className="menu-title">Menu</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent className="menu-content">
            <motion.div
              style={{ display: "flex", flexDirection: "column", height: "100%" }}
              variants={listVariants}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {menuItems.map((item, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <IonMenuToggle autoHide={false}>
                    <IonItem
                      button
                      onClick={() => setActivePage(item.key)}
                      className={`menu-item ${activePage === item.key ? "active" : ""}`}
                      lines="none"
                    >
                      <img src={item.icon} alt={item.name} className="menu-icon" />
                      <span className="menu-text">{item.name}</span>
                    </IonItem>
                  </IonMenuToggle>
                </motion.div>
              ))}

              {/* Logout Button at Bottom */}
              <motion.div variants={itemVariants} className="logout-container">
                <IonMenuToggle autoHide={false}>
                  <IonButton
                    expand="block"
                    className="logout-button"
                    onClick={() => history.push("/home")}
                  >
                    <IonIcon icon={logOutOutline} slot="start" />
                    Logout
                  </IonButton>
                </IonMenuToggle>
              </motion.div>
            </motion.div>
          </IonContent>
        </IonMenu>

        {/* Main Content */}
        <IonPage id="main" className="dashboard-main">
          <IonHeader>
            <IonToolbar className="main-toolbar">
              <IonButtons slot="start">
                <IonMenuButton />
              </IonButtons>
              <IonTitle className="main-title">
                {menuItems.find((m) => m.key === activePage)?.name || "Dashboard Motion"}
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
                className="main-content"
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

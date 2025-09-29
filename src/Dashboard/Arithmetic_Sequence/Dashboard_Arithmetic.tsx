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
} from "@ionic/react";
import { IonIcon } from "@ionic/react";
import { logOutOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";

import ArithmeticHome from "./Arithmetic_Home";
import ArithmeticModule from "./Arithmetic_Module";
import ArithmeticLeaderboard from "./Arithmetic_Leaderboard";
import ArithmeticRadar from "./Arithmetic_Radar";

// ✅ Import custom icons
import iconHome from "../../assets/icon_home.gif";
import iconModule from "../../assets/icon_module.gif";
import iconLeaderboard from "../../assets/icon_leaderboard.gif";
import iconRadar from "../../assets/icon_radar.png";

const Dashboard_Arithmetic: React.FC = () => {
  const history = useHistory();
  const [activePage, setActivePage] = useState("Home");

  // ✅ use custom icons for all menu items
  const menuItems = [
    { name: "Home", key: "Home", icon: iconHome },
    { name: "Module", key: "module", icon: iconModule },
    { name: "Leaderboard", key: "leaderboard", icon: iconLeaderboard },
    { name: "Radar", key: "radar", icon: iconRadar },
  ];

  const renderContent = () => {
    switch (activePage) {
      case "Home":
        return <ArithmeticHome />;
      case "module":
        return <ArithmeticModule />;
      case "leaderboard":
        return <ArithmeticLeaderboard />;
      case "radar":
        return <ArithmeticRadar />;
      default:
        return (
          <h2 style={{ textAlign: "center", marginTop: "2rem" }}>
            Welcome to Arithmetic Dashboard
          </h2>
        );
    }
  };

  return (
    <IonPage>
      <IonSplitPane contentId="main" when="(min-width: 768px)">
        {/* Side Menu */}
        <IonMenu contentId="main">
          <IonHeader>
            <IonToolbar>
              <IonTitle>Menu</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {menuItems.map((item, index) => (
              <IonMenuToggle key={index} autoHide={false}>
                <IonItem
                  button
                  onClick={() => setActivePage(item.key)}
                  lines="none"
                >
                  {/* ✅ Custom icons */}
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
                          backgroundColor: "#3b82f6", // underline
                          borderRadius: "2px",
                        }}
                      />
                    )}
                  </span>
                </IonItem>
              </IonMenuToggle>
            ))}

            {/* Logout Button → Home */}
            <IonMenuToggle autoHide={false}>
              <IonButton
                expand="block"
                color="primary"
                style={{ marginTop: "1rem" }}
                onClick={() => history.push("/education/home")}
              >
                <IonIcon icon={logOutOutline} slot="start" />
                Logout
              </IonButton>
            </IonMenuToggle>
          </IonContent>
        </IonMenu>

        {/* Main Content */}
        <IonPage id="main">
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonMenuButton />
              </IonButtons>
              <IonTitle>
                {menuItems.find((m) => m.key === activePage)?.name ||
                  "Dashboard Arithmetic"}
              </IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent>{renderContent()}</IonContent>
        </IonPage>
      </IonSplitPane>
    </IonPage>
  );
};

export default Dashboard_Arithmetic;

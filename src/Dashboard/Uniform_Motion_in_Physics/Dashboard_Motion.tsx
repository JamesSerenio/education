import React, { useState } from "react";
import {
  IonButtons,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonMenu,
  IonMenuButton,
  IonMenuToggle,
  IonPage,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import {
  homeOutline,
  logOutOutline,
  layersOutline,
  trophyOutline,
  navigateOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";

import ArithmeticHome from "./Motion_Home";
import ArithmeticModule from "./Motion_Module";
import ArithmeticLeaderboard from "./Motion_Leaderboard";
import ArithmeticRadar from "./Motion_Radar";

const Dashboard_Motion: React.FC = () => {
  const history = useHistory();
  const [activePage, setActivePage] = useState("Home");

  const menuItems = [
    { name: "Home", key: "Home", icon: homeOutline, path: "/education/Motion_Home" },
    { name: "Module", key: "module", icon: layersOutline, path: "/education/Motion_Module" },
    { name: "Leaderboard", key: "leaderboard", icon: trophyOutline, path: "/education/Motion_Leaderboard" },
    { name: "Radar", key: "radar", icon: navigateOutline, path: "/education/Motion_Radar" },
  ];

  const renderContent = () => {
    switch (activePage) {
      case "Home":
        return <ArithmeticHome />; // ✅ gumamit na ng ArithmeticHome
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
                  <IonIcon icon={item.icon} slot="start" />
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
                          content: '""',
                          position: "absolute",
                          left: 0,
                          bottom: 0,
                          width: "100%",
                          height: "2px",
                          backgroundColor: "#3b82f6", // underline color
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

export default Dashboard_Motion;

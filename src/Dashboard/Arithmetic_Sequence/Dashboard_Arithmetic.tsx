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

import ArithmeticModule from "./Arithmetic_Module";
import ArithmeticLeaderboard from "./Arithmetic_Leaderboard";
import ArithmeticRadar from "./Arithmetic_Radar";

const Dashboard_Arithmetic: React.FC = () => {
  const history = useHistory();
  const [activePage, setActivePage] = useState("Home");

  const menuItems = [
    { name: "Home", key: "Home", icon: homeOutline },
    { name: "Module", key: "module", icon: layersOutline },
    { name: "Leaderboard", key: "leaderboard", icon: trophyOutline },
    { name: "Radar", key: "radar", icon: navigateOutline },
  ];

  const renderContent = () => {
    switch (activePage) {
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
                >
                  <IonIcon icon={item.icon} slot="start" />
                  {item.name}
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

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

// ✅ Import your page components
import AdminHome from "./admin_home";
import AdminAddQuiz from "./admin_addquiz";
import AdminLeaderboard from "./admin_leaderboard";
import AdminRadar from "./admin_radar";

const AdminDashboard: React.FC = () => {
  const history = useHistory();
  const [activePage, setActivePage] = useState("Home");

  const menuItems = [
    { name: "Home", key: "Home", icon: homeOutline },
    { name: "Quiz", key: "quiz", icon: layersOutline },
    { name: "Leaderboard", key: "leaderboard", icon: trophyOutline },
    { name: "Radar", key: "radar", icon: navigateOutline },
  ];

  // ✅ Decide which component to render
  const renderContent = () => {
    switch (activePage) {
      case "Home":
        return <AdminHome />;
      case "quiz":
        return <AdminAddQuiz />;
      case "leaderboard":
        return <AdminLeaderboard />;
      case "radar":
        return <AdminRadar />;
      default:
        return <h2 style={{ padding: "1rem" }}>Dashboard Arithmetic</h2>;
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
                onClick={() => history.push("/education/login")}
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

export default AdminDashboard;

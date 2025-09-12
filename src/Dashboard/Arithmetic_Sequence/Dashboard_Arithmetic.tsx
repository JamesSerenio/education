import React from "react";
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
  IonRouterOutlet,
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
import { Route } from "react-router-dom";
import ArithmeticHome from "./Arithmetic_Home";
import ArithmeticModule from "./Arithmetic_Module";
import ArithmeticLeaderboard from "./Arithmetic_Leaderboard";
import ArithmeticRadar from "./Arithmetic_Radar";

const Dashboard_Arithmetic: React.FC = () => {
  const path = [
    { name: "Home", url: "/education/Arithmetic_Home", icon: homeOutline },
    { name: "Module", url: "/education/Arithmetic_Module", icon: layersOutline },
    { name: "LeaderBoard", url: "/education/Arithmetic_Leaderboard", icon: trophyOutline },
    { name: "Radar", url: "/education/Arithmetic_Radar", icon: navigateOutline },
  ];

  return (
    <IonPage>
      <IonSplitPane contentId="main">
        {/* Side Menu */}
        <IonMenu contentId="main">
          <IonHeader>
            <IonToolbar>
              <IonTitle>Menu</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {path.map((item, index) => (
              <IonMenuToggle key={index}>
                <IonItem routerLink={item.url} routerDirection="forward" button>
                  <IonIcon icon={item.icon} slot="start" />
                  {item.name}
                </IonItem>
              </IonMenuToggle>
            ))}

            {/* Logout Button */}
            <IonButton
              routerLink="/education/home"
              routerDirection="back"
              expand="full"
              style={{ marginTop: "1rem" }}
            >
              <IonIcon icon={logOutOutline} slot="start" />
              Logout
            </IonButton>
          </IonContent>
        </IonMenu>

        {/* Main Content Area */}
        <IonPage id="main">
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonMenuButton />
              </IonButtons>
              <IonTitle>Dashboard Arithmetic</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent>
            <IonRouterOutlet>
              <Route exact path="/education/Arithmetic_Home" component={ArithmeticHome} />
              <Route exact path="/education/Arithmetic_Module" component={ArithmeticModule} />
              <Route exact path="/education/Arithmetic_Leaderboard" component={ArithmeticLeaderboard} />
              <Route exact path="/education/Arithmetic_Radar" component={ArithmeticRadar} />
            </IonRouterOutlet>
          </IonContent>
        </IonPage>
      </IonSplitPane>
    </IonPage>
  );
};

export default Dashboard_Arithmetic;

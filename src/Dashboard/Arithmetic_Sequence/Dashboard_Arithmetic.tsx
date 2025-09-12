import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonMenu,
  IonMenuToggle,
  IonMenuButton,
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

const Dashboard_Arithmetic: React.FC = () => {
  const path = [
    { name: "Home", url: "/education/Arithmetic_Home", icon: homeOutline },
    { name: "Module", url: "/education/Arithmetic_Module", icon: layersOutline },
    { name: "LeaderBoard", url: "/education/Arithmetic_Leaderboard", icon: trophyOutline },
    { name: "Radar", url: "/education/Arithmetic_Radar", icon: navigateOutline, },
  ];

  return (
    <IonPage>
      <IonSplitPane contentId="main">
        <IonMenu contentId="main">
          <IonHeader>
            <IonToolbar>
              {/* Menu toggle button */}
              <IonMenuButton slot="start" />
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
              routerLink="/education/login"
              routerDirection="back"
              expand="full"
              style={{ marginTop: "1rem" }}
            >
              <IonIcon icon={logOutOutline} slot="start" />
              Logout
            </IonButton>
          </IonContent>
        </IonMenu>

        <IonRouterOutlet id="main">
          {/* Place nested routes or dashboard content here */}
        </IonRouterOutlet>
      </IonSplitPane>
    </IonPage>
  );
};

export default Dashboard_Arithmetic;

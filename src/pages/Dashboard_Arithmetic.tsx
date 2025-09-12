import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonMenu,
  IonMenuToggle,
  IonPage,
  IonRouterOutlet,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { homeOutline, logOutOutline, rocketOutline } from "ionicons/icons";

const Dashboard_Arithmetic: React.FC = () => {
  const path = [
    { name: "Home", url: "/education/home", icon: homeOutline },
    { name: "About", url: "/education/about", icon: rocketOutline },
  ];

  return (
    <IonPage>
      <IonSplitPane contentId="main">
        <IonMenu contentId="main">
          <IonHeader>
            <IonToolbar>
              <IonTitle>Menu</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {path.map((item, index) => (
              <IonMenuToggle key={index}>
                <IonItem routerLink={item.url} routerDirection="forward">
                  <IonIcon icon={item.icon} slot="start" />
                  {item.name}
                </IonItem>
              </IonMenuToggle>
            ))}

            {/* Logout Button */}
            <IonButton routerLink="/education/home" routerDirection="back" expand="full">
              <IonIcon icon={logOutOutline} slot="start" />
              Logout
            </IonButton>
          </IonContent>
        </IonMenu>

        <IonRouterOutlet id="main">
          {/* Dito mo ilalagay ang mga nested routes o content ng dashboard */}
        </IonRouterOutlet>
      </IonSplitPane>
    </IonPage>
  );
};

export default Dashboard_Arithmetic;

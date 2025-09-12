import React from "react";
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle } from "@ionic/react";

const Dashboard_Arithmetic: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Dashboard Arithmetic</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <p>Welcome to the Arithmetic Sequence Dashboard!</p>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard_Arithmetic;

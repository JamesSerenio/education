import {
  IonPage,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from "@ionic/react";

const Home: React.FC = () => {
  const handleNavigate = (path: string) => {
    // Hard refresh para laging fresh yung page (GH Pages friendly)
    window.location.href = path;
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            flexWrap: "wrap",
            marginTop: "2rem",
          }}
        >
          {/* Arithmetic Sequence Card */}
          <IonCard style={{ flex: "1 1 300px", maxWidth: "400px" }}>
            <IonCardHeader>
              <IonCardTitle>Arithmetic Sequence</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>Explore the properties and problems of arithmetic sequences.</p>
              <IonButton
                expand="block"
                onClick={() => handleNavigate("/education/dashboard_arithmetic")}
              >
                Start
              </IonButton>
            </IonCardContent>
          </IonCard>

          {/* Uniform Motion in Physics Card */}
          <IonCard style={{ flex: "1 1 300px", maxWidth: "400px" }}>
            <IonCardHeader>
              <IonCardTitle>Uniform Motion in Physics</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>Learn about uniform motion concepts and calculations.</p>
              <IonButton
                expand="block"
                onClick={() => handleNavigate("/education/dashboard_motion")}
              >
                Start
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;

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
  // Hard refresh navigation function
  const goTo = (path: string) => {
    window.location.href = path; // forces full reload
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
          <IonCard
            style={{ flex: "1 1 300px", maxWidth: "400px", cursor: "pointer" }}
            onClick={() => goTo("/education/dashboard_arithmetic")}
          >
            <IonCardHeader>
              <IonCardTitle>Arithmetic Sequence</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>Explore the properties and problems of arithmetic sequences.</p>
              <IonButton expand="block">
                Start
              </IonButton>
            </IonCardContent>
          </IonCard>

          {/* Uniform Motion in Physics Card */}
          <IonCard
            style={{ flex: "1 1 300px", maxWidth: "400px", cursor: "pointer" }}
            onClick={() => goTo("/education/dashboard_motion")}
          >
            <IonCardHeader>
              <IonCardTitle>Uniform Motion in Physics</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>Learn about uniform motion concepts and calculations.</p>
              <IonButton expand="block">
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

import {
  IonPage,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from "@ionic/react";
import { useHistory } from "react-router-dom"; // ✅ Import useHistory

const Home: React.FC = () => {
  const history = useHistory(); // ✅ Initialize history

  const handleNavigate = (path: string) => {
    history.push(path); // ✅ No page reload — GH Pages safe
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

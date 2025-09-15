import {
  IonContent,
  IonPage,
  IonButton,
} from "@ionic/react";

const Arithmetic_Home: React.FC = () => {
  const handleStartQuiz = () => {
    console.log("Start the Quiz tapped!");
    // example: redirect to quiz page
    // history.push("/education/module");
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div
          style={{
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f8f9fa",
          }}
        >
          <IonButton
            expand="block"
            size="large"
            color="primary"
            onClick={handleStartQuiz}
            style={{
              maxWidth: "250px",
              textTransform: "none", 
              padding: "20px 10px",
            }}
          >
            <div style={{ textAlign: "center", lineHeight: "1.2" }}>
              <div style={{ fontSize: "25px", fontWeight: "bold" }}>Start</div>
              <div style={{ fontSize: "25px", fontWeight: "bold" }}>The Quiz</div>
            </div>
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Arithmetic_Home;

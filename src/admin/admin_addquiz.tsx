import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonTextarea,
  IonButton,
} from "@ionic/react";

const AdminAddQuiz: React.FC = () => {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [question, setQuestion] = useState("");
  const [solution, setSolution] = useState("");
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    const quizData = { subject, category, question, solution, answer };
    console.log("Quiz Data Submitted:", quizData);

    // Later you can call Supabase/DB insert here
    alert("Quiz saved successfully!");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Add Quiz</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Select Subject */}
        <IonItem>
          <IonLabel position="stacked">Select Subject</IonLabel>
          <IonSelect
            placeholder="Select subject"
            value={subject}
            onIonChange={(e) => setSubject(e.detail.value)}
          >
            <IonSelectOption value="Arithmetic Sequence">
              Arithmetic Sequence
            </IonSelectOption>
            <IonSelectOption value="Uniform Motion in Physics">
              Uniform Motion in Physics
            </IonSelectOption>
          </IonSelect>
        </IonItem>

        {/* Select Categories */}
        <IonItem>
          <IonLabel position="stacked">Select Categories</IonLabel>
          <IonSelect
            placeholder="Select categories"
            value={category}
            onIonChange={(e) => setCategory(e.detail.value)}
          >
            <IonSelectOption value="Problem Solving">Problem Solving</IonSelectOption>
            <IonSelectOption value="Solving">Solving</IonSelectOption>
          </IonSelect>
        </IonItem>

        {/* Quiz Question */}
        <IonItem>
          <IonLabel position="stacked">Quiz Question</IonLabel>
          <IonInput
            placeholder="Enter your quiz question"
            value={question}
            onIonChange={(e) => setQuestion(e.detail.value!)}
          />
        </IonItem>

        {/* The Solution */}
        <IonItem>
          <IonLabel position="stacked">The Solution</IonLabel>
          <IonTextarea
            placeholder="Write the solution here"
            value={solution}
            onIonChange={(e) => setSolution(e.detail.value!)}
          />
        </IonItem>

        {/* The Answer */}
        <IonItem>
          <IonLabel position="stacked">The Answer</IonLabel>
          <IonInput
            placeholder="Enter the correct answer"
            value={answer}
            onIonChange={(e) => setAnswer(e.detail.value!)}
          />
        </IonItem>

        {/* Submit Button */}
        <IonButton
          expand="block"
          color="primary"
          onClick={handleSubmit}
          style={{ marginTop: "20px" }}
        >
          Save Quiz
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default AdminAddQuiz;

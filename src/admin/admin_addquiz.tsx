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
import { supabase } from "../utils/supabaseClient"; // ✅ import supabase client

const AdminAddQuiz: React.FC = () => {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [question, setQuestion] = useState("");
  const [solution, setSolution] = useState("");
  const [answer, setAnswer] = useState("");

  const handleSubmit = async () => {
    if (!subject || !category || !question || !answer) {
      alert("Please fill in all required fields!");
      return;
    }

    const { data, error } = await supabase.from("quizzes").insert([
      { subject, category, question, solution, answer },
    ]);

    if (error) {
      console.error("Error inserting quiz:", error.message);
      alert("Failed to save quiz!");
    } else {
      console.log("Quiz Saved:", data);
      alert("Quiz saved successfully!");
      setSubject("");
      setCategory("");
      setQuestion("");
      setSolution("");
      setAnswer("");
    }
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
            <IonSelectOption value="Arithmetic Sequence">Arithmetic Sequence</IonSelectOption>
            <IonSelectOption value="Uniform Motion in Physics">Uniform Motion in Physics</IonSelectOption>
          </IonSelect>
        </IonItem>

        {/* Select Category */}
        <IonItem>
          <IonLabel position="stacked">Select Category</IonLabel>
          <IonSelect
            placeholder="Select category"
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
            placeholder="Enter quiz question"
            value={question}
            onIonChange={(e) => setQuestion(e.detail.value!)}
          />
        </IonItem>

        {/* Solution */}
        <IonItem>
          <IonLabel position="stacked">Solution</IonLabel>
          <IonTextarea
            placeholder="Write the solution"
            value={solution}
            onIonChange={(e) => setSolution(e.detail.value!)}
          />
        </IonItem>

        {/* Answer */}
        <IonItem>
          <IonLabel position="stacked">Answer</IonLabel>
          <IonInput
            placeholder="Enter correct answer"
            value={answer}
            onIonChange={(e) => setAnswer(e.detail.value!)}
          />
        </IonItem>

        {/* Submit */}
        <IonButton expand="block" color="primary" onClick={handleSubmit} style={{ marginTop: "20px" }}>
          Save Quiz
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default AdminAddQuiz;

// src/pages/AdminAddQuiz.tsx
import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonTextarea,
  IonButton,
  IonList,
  IonIcon,
} from "@ionic/react";
import { closeCircleOutline } from "ionicons/icons";
import { supabase } from "../utils/supabaseClient";
import { motion } from "framer-motion"; // ✅ added animation import

const AdminAddQuiz: React.FC = () => {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [solution, setSolution] = useState("");
  const [answer, setAnswer] = useState("");

  const [altInput, setAltInput] = useState("");
  const [acceptedAnswers, setAcceptedAnswers] = useState<string[]>([]);

  const addAcceptedAnswer = () => {
    const v = (altInput || "").trim();
    if (!v) return;
    const exists = acceptedAnswers.some((a) => a.toLowerCase() === v.toLowerCase());
    if (!exists) setAcceptedAnswers((p) => [...p, v]);
    setAltInput("");
  };

  const removeAcceptedAnswer = (idx: number) => {
    setAcceptedAnswers((p) => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!subject || !category || !level || !question || !answer) {
      alert("Please fill in all required fields!");
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        subject,
        category,
        level,
        question,
        solution,
        answer,
      };

      if (acceptedAnswers.length > 0) {
        payload.accepted_answers = acceptedAnswers;
      }

      const { data, error } = await supabase.from("quizzes").insert([payload]);

      if (error) {
        console.error("Error inserting quiz:", error.message);
        alert("Failed to save quiz! (check DB) — " + error.message);
      } else {
        console.log("Quiz Saved:", data);
        alert("Quiz saved successfully!");
        setSubject("");
        setCategory("");
        setLevel(null);
        setQuestion("");
        setSolution("");
        setAnswer("");
        setAcceptedAnswers([]);
        setAltInput("");
      }
    } catch (err) {
      console.error("Unexpected error inserting quiz:", err);
      alert("Unexpected error. Check console.");
    }
  };

  return (
    <IonPage>
      <IonHeader />
      <IonContent className="ion-padding">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Select Subject */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
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
          </motion.div>

          {/* Select Category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <IonItem>
              <IonLabel position="stacked">Select Category</IonLabel>
              <IonSelect
                placeholder="Select category"
                value={category}
                onIonChange={(e) => setCategory(e.detail.value)}
              >
                <IonSelectOption value="Problem Solving">
                  Problem Solving
                </IonSelectOption>
                <IonSelectOption value="Solving">Number Solving</IonSelectOption>
              </IonSelect>
            </IonItem>
          </motion.div>

          {/* Select Level */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <IonItem>
              <IonLabel position="stacked">Select Level (1-5)</IonLabel>
              <IonSelect
                placeholder="Select level"
                value={level ?? ""}
                onIonChange={(e) => setLevel(Number(e.detail.value))}
              >
                <IonSelectOption value={1}>1</IonSelectOption>
                <IonSelectOption value={2}>2</IonSelectOption>
                <IonSelectOption value={3}>3</IonSelectOption>
                <IonSelectOption value={4}>4</IonSelectOption>
                <IonSelectOption value={5}>5</IonSelectOption>
              </IonSelect>
            </IonItem>
          </motion.div>

          {/* Quiz Question */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <IonItem>
              <IonLabel position="stacked">Quiz Question</IonLabel>
              <IonInput
                placeholder="Enter quiz question"
                value={question}
                onIonChange={(e) => setQuestion(e.detail.value!)}
              />
            </IonItem>
          </motion.div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <IonItem>
              <IonLabel position="stacked">Solution</IonLabel>
              <IonTextarea
                placeholder="Write the solution"
                value={solution}
                autoGrow={true}
                onIonChange={(e) => setSolution(e.detail.value!)}
              />
            </IonItem>
          </motion.div>

          {/* Answer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <IonItem>
              <IonLabel position="stacked">Primary Answer (required)</IonLabel>
              <IonInput
                placeholder="Enter correct answer (primary)"
                value={answer}
                onIonChange={(e) => setAnswer(e.detail.value!)}
              />
            </IonItem>
          </motion.div>

          {/* Alternate Answers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <IonItem>
              <IonLabel position="stacked">
                Alternate / Accepted Answers (optional)
              </IonLabel>
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                <IonInput
                  placeholder="e.g. 2,300 or 2300"
                  value={altInput}
                  onIonChange={(e) => setAltInput(e.detail.value!)}
                />
                <IonButton onClick={addAcceptedAnswer}>Add</IonButton>
              </div>
            </IonItem>

            <IonList>
              {acceptedAnswers.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <IonItem>
                    <div style={{ flex: 1 }}>{a}</div>
                    <IonButton fill="clear" onClick={() => removeAcceptedAnswer(i)}>
                      <IonIcon icon={closeCircleOutline} />
                    </IonButton>
                  </IonItem>
                </motion.div>
              ))}
            </IonList>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
          >
            <IonButton
              expand="block"
              color="primary"
              onClick={handleSubmit}
              style={{ marginTop: "20px" }}
            >
              Save Quiz
            </IonButton>
          </motion.div>
        </motion.div>
      </IonContent>
    </IonPage>
  );
};

export default AdminAddQuiz;

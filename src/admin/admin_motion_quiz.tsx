import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonAlert,
  IonModal,
  IonInput,
} from "@ionic/react";
import { createOutline, trashOutline } from "ionicons/icons";
import { supabase } from "../utils/supabaseClient";

interface Quiz {
  id: string;
  subject: string;
  category: string;
  question: string;
  solution: string | null;
  answer: string;
  created_at: string;
}

const AdminMotionQuiz: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Edit modal
  const [editQuiz, setEditQuiz] = useState<Quiz | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editSolution, setEditSolution] = useState("");

  // ✅ Load quizzes (motion category)
  const fetchQuizzes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("category", "motion")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching quizzes:", error.message);
    } else {
      setQuizzes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // ✅ Delete quiz
  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("quizzes").delete().eq("id", deleteId);
    if (error) {
      console.error("Error deleting quiz:", error.message);
    } else {
      setQuizzes(quizzes.filter((q) => q.id !== deleteId));
    }
    setDeleteId(null);
  };

  // ✅ Open edit modal
  const openEdit = (quiz: Quiz) => {
    setEditQuiz(quiz);
    setEditQuestion(quiz.question);
    setEditAnswer(quiz.answer);
    setEditSolution(quiz.solution || "");
  };

  // ✅ Save edit
  const handleEditSave = async () => {
    if (!editQuiz) return;
    const { error } = await supabase
      .from("quizzes")
      .update({
        question: editQuestion,
        answer: editAnswer,
        solution: editSolution,
      })
      .eq("id", editQuiz.id);

    if (error) {
      console.error("Error updating quiz:", error.message);
    } else {
      setQuizzes(
        quizzes.map((q) =>
          q.id === editQuiz.id
            ? {
                ...q,
                question: editQuestion,
                answer: editAnswer,
                solution: editSolution,
              }
            : q
        )
      );
      setEditQuiz(null);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Motion Quizzes</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {loading ? (
          <p style={{ padding: "1rem" }}>Loading quizzes...</p>
        ) : quizzes.length === 0 ? (
          <p style={{ padding: "1rem" }}>No quizzes found.</p>
        ) : (
          <IonList>
            {quizzes.map((quiz) => (
              <IonItem key={quiz.id}>
                <IonLabel>
                  <h2>
                    <strong>Q:</strong> {quiz.question}
                  </h2>
                  <p>
                    <strong>Answer:</strong> {quiz.answer}
                  </p>
                  {quiz.solution && (
                    <p>
                      <strong>Solution:</strong> {quiz.solution}
                    </p>
                  )}
                </IonLabel>
                <IonButton
                  fill="clear"
                  color="primary"
                  onClick={() => openEdit(quiz)}
                >
                  <IonIcon slot="icon-only" icon={createOutline} />
                </IonButton>
                <IonButton
                  fill="clear"
                  color="danger"
                  onClick={() => setDeleteId(quiz.id)}
                >
                  <IonIcon slot="icon-only" icon={trashOutline} />
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}

        {/* ✅ Delete Alert */}
        <IonAlert
          isOpen={!!deleteId}
          onDidDismiss={() => setDeleteId(null)}
          header="Confirm Delete"
          message="Are you sure you want to delete this quiz?"
          buttons={[
            { text: "Cancel", role: "cancel" },
            { text: "Delete", handler: handleDelete },
          ]}
        />

        {/* ✅ Edit Modal */}
        <IonModal isOpen={!!editQuiz} onDidDismiss={() => setEditQuiz(null)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Quiz</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent style={{ padding: "1rem" }}>
            <IonItem>
              <IonLabel position="stacked">Question</IonLabel>
              <IonInput
                value={editQuestion}
                onIonChange={(e) => setEditQuestion(e.detail.value!)}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Answer</IonLabel>
              <IonInput
                value={editAnswer}
                onIonChange={(e) => setEditAnswer(e.detail.value!)}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Solution</IonLabel>
              <IonInput
                value={editSolution}
                onIonChange={(e) => setEditSolution(e.detail.value!)}
              />
            </IonItem>
            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <IonButton color="primary" onClick={handleEditSave}>
                Save
              </IonButton>
              <IonButton
                color="medium"
                onClick={() => setEditQuiz(null)}
                style={{ marginLeft: "0.5rem" }}
              >
                Cancel
              </IonButton>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default AdminMotionQuiz;

import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonAlert,
  IonModal,
  IonInput,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonTextarea,
} from "@ionic/react";
import { createOutline, trashOutline } from "ionicons/icons";
import { supabase } from "../utils/supabaseClient";

interface Quiz {
  id: string;
  subject: string;
  category: string;
  level: number;
  question: string;
  solution: string | null;
  answer: string;
  accepted_answers?: string[];
  created_at: string;
}

const AdminArithmeticQuiz: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Edit modal
  const [editQuiz, setEditQuiz] = useState<Quiz | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editSolution, setEditSolution] = useState("");
  const [editLevel, setEditLevel] = useState<number>(1);
  const [editCategory, setEditCategory] = useState<string>("");
  const [editAcceptedAnswers, setEditAcceptedAnswers] = useState<string>("");

  // ✅ Fetch quizzes
  const fetchQuizzes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("subject", "Arithmetic Sequence")
      .order("category", { ascending: true })
      .order("level", { ascending: true });

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
    if (error) console.error("Error deleting quiz:", error.message);
    else setQuizzes(quizzes.filter((q) => q.id !== deleteId));
    setDeleteId(null);
  };

  // ✅ Open edit modal
  const openEdit = (quiz: Quiz) => {
    setEditQuiz(quiz);
    setEditQuestion(quiz.question);
    setEditAnswer(quiz.answer);
    setEditSolution(quiz.solution || "");
    setEditLevel(quiz.level || 1);
    setEditCategory(quiz.category);
    setEditAcceptedAnswers((quiz.accepted_answers || []).join("\n"));
  };

  // ✅ Save edit
  const handleEditSave = async () => {
    if (!editQuiz) return;

    const acceptedAnswersArray = editAcceptedAnswers
      .split("\n")
      .map((a) => a.trim())
      .filter((a) => a !== "");

    const { error } = await supabase
      .from("quizzes")
      .update({
        question: editQuestion,
        answer: editAnswer,
        solution: editSolution,
        level: editLevel,
        category: editCategory,
        accepted_answers: acceptedAnswersArray,
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
                level: editLevel,
                category: editCategory,
                accepted_answers: acceptedAnswersArray,
              }
            : q
        )
      );
      setEditQuiz(null);
    }
  };

  // ✅ Group quizzes by category
  const groupedQuizzes = quizzes.reduce((acc: { [key: string]: Quiz[] }, quiz) => {
    if (!acc[quiz.category]) acc[quiz.category] = [];
    acc[quiz.category].push(quiz);
    return acc;
  }, {});

  const categories = Object.keys(groupedQuizzes).sort();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Arithmetic Quizzes</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <style>{`
          .quiz-table-container {
            margin-bottom: 2rem;
            width: 100%;
            overflow-x: auto; /* ✅ scroll horizontally on mobile */
          }
          .category-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem;
            border-radius: 8px 8px 0 0;
            font-size: 1.2rem;
            font-weight: bold;
            text-align: center;
          }
          .quiz-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            min-width: 650px; /* ✅ ensures table doesn't break on small screens */
          }
          .quiz-table th,
          .quiz-table td {
            padding: 0.75rem;
            border-bottom: 1px solid #ddd;
            vertical-align: top;
          }
          .quiz-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            white-space: nowrap;
          }
          .actions-cell {
            text-align: center;
            white-space: nowrap;
          }
          .actions-cell ion-button {
            --padding-start: 0;
            --padding-end: 0;
            margin: 0 2px;
          }
          pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            margin: 0;
            font-family: inherit;
          }

          /* ✅ Mobile Responsive Styles */
          @media (max-width: 768px) {
            .quiz-table {
              font-size: 14px;
              min-width: 500px;
            }
            .category-header {
              font-size: 1rem;
              padding: 0.8rem;
            }
            th, td {
              padding: 0.5rem;
            }
          }
        `}</style>

        {loading ? (
          <div>Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <div>No quizzes found.</div>
        ) : (
          categories.map((category) => (
            <div key={category} className="quiz-table-container">
              <div className="category-header">
                {category} ({groupedQuizzes[category].length})
              </div>
              <table className="quiz-table">
                <thead>
                  <tr>
                    <th>Level</th>
                    <th>Question</th>
                    <th>Answer</th>
                    <th>Solution</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedQuizzes[category].map((quiz) => (
                    <tr key={quiz.id}>
                      <td>L{quiz.level}</td>
                      <td><pre>{quiz.question}</pre></td>
                      <td><pre>{quiz.answer}</pre></td>
                      <td><pre>{quiz.solution || "No solution"}</pre></td>
                      <td>{new Date(quiz.created_at).toLocaleDateString()}</td>
                      <td className="actions-cell">
                        <IonButton
                          fill="clear"
                          size="small"
                          color="primary"
                          onClick={() => openEdit(quiz)}
                        >
                          <IonIcon icon={createOutline} />
                        </IonButton>
                        <IonButton
                          fill="clear"
                          size="small"
                          color="danger"
                          onClick={() => setDeleteId(quiz.id)}
                        >
                          <IonIcon icon={trashOutline} />
                        </IonButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}

        {/* ✅ Delete Alert */}
        <IonAlert
          isOpen={!!deleteId}
          onDidDismiss={() => setDeleteId(null)}
          header="Confirm Delete"
          message="Are you sure you want to delete this quiz?"
          buttons={[
            { text: "Cancel", role: "cancel" },
            { text: "Delete", cssClass: "danger-button", handler: handleDelete },
          ]}
        />

        {/* ✅ Edit Modal */}
        <IonModal isOpen={!!editQuiz} onDidDismiss={() => setEditQuiz(null)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Quiz</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Category</IonLabel>
              <IonSelect
                value={editCategory}
                onIonChange={(e) => setEditCategory(e.detail.value!)}
              >
                <IonSelectOption value="Problem Solving">Problem Solving</IonSelectOption>
                <IonSelectOption value="Number Solving">Number Solving</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Level</IonLabel>
              <IonInput
                type="number"
                value={editLevel}
                onIonChange={(e) => setEditLevel(parseInt(e.detail.value!) || 1)}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Question</IonLabel>
              <IonTextarea
                autoGrow
                value={editQuestion}
                onIonChange={(e) => setEditQuestion(e.detail.value!)}
                placeholder="Enter question..."
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Primary Answer</IonLabel>
              <IonTextarea
                autoGrow
                value={editAnswer}
                onIonChange={(e) => setEditAnswer(e.detail.value!)}
                placeholder="Enter main correct answer..."
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Alternate Answers (one per line)</IonLabel>
              <IonTextarea
                autoGrow
                value={editAcceptedAnswers}
                onIonChange={(e) => setEditAcceptedAnswers(e.detail.value!)}
                placeholder="Example:\n2,300\n2300.0\n2.3k"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Solution</IonLabel>
              <IonTextarea
                autoGrow
                value={editSolution}
                onIonChange={(e) => setEditSolution(e.detail.value!)}
                placeholder="Enter solution steps..."
              />
            </IonItem>

            <div
              style={{
                marginTop: "1.5rem",
                textAlign: "center",
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <IonButton color="success" onClick={handleEditSave}>
                Save Changes
              </IonButton>
              <IonButton color="medium" fill="outline" onClick={() => setEditQuiz(null)}>
                Cancel
              </IonButton>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default AdminArithmeticQuiz;

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
  const [editLevel, setEditLevel] = useState<number>(1);
  const [editCategory, setEditCategory] = useState<string>("");

  // ✅ Load quizzes (filtered by subject = Uniform Motion in Physics to match your data)
  const fetchQuizzes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("subject", "Uniform Motion in Physics") // ✅ Filter by exact subject for dashboard visibility
      .order("category", { ascending: true }) // ✅ Order by category first (like Arithmetic)
      .order("level", { ascending: true }); // ✅ Then by level for proper sequencing

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
    setEditLevel(quiz.level || 1);
    setEditCategory(quiz.category);
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
        level: editLevel,
        category: editCategory,
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
              }
            : q
        )
      );
      setEditQuiz(null);
    }
  };

  // ✅ Group quizzes by category for table-like separation (same as Arithmetic)
  const groupedQuizzes = quizzes.reduce((acc: { [key: string]: Quiz[] }, quiz) => {
    if (!acc[quiz.category]) {
      acc[quiz.category] = [];
    }
    acc[quiz.category].push(quiz);
    return acc;
  }, {});

  const categories = Object.keys(groupedQuizzes).sort();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Uniform Motion Quizzes</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ padding: "1rem" }}>
        <style>{`
          .quiz-table-container {
            margin-bottom: 2rem;
            width: 100%;
          }
          .category-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem;
            border-radius: 8px 8px 0 0;
            margin-bottom: 0;
            font-size: 1.2rem;
            font-weight: bold;
            text-align: center;
          }
          .table-wrapper {
            overflow-x: auto; /* ✅ Scroll if maliit screen */
            border-radius: 0 0 8px 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .quiz-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            table-layout: fixed; /* ✅ Para auto-truncate text */
          }
          .quiz-table th,
          .quiz-table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #ddd;
            white-space: nowrap; 
            overflow: hidden; 
            text-overflow: ellipsis; /* ✅ Ellipsis kapag mahaba */
          }
          .quiz-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #333;
            border-top: 1px solid #ddd;
          }
          .quiz-table tr:hover {
            background-color: #f5f5f5;
          }
          /* ✅ Para sa Actions column laging visible */
          .actions-cell {
            text-align: center;
            width: 90px; /* fixed width */
          }
          .actions-cell ion-button {
            margin: 0 2px;
          }

          /* ✅ Mobile tweaks */
          @media (max-width: 768px) {
            .quiz-table th,
            .quiz-table td {
              font-size: 12px;  /* mas maliit text */
              padding: 0.5rem;
            }
            .actions-cell {
              width: 70px;
            }
          }
        `}</style>

        {loading ? (
          <div className="loading">Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <div className="no-quizzes">No quizzes found.</div>
        ) : (
          categories.map((category) => (
            <div key={category} className="quiz-table-container">
              <div className="category-header">
                {category} Category ({groupedQuizzes[category].length} Quizzes)
              </div>
              <div className="table-wrapper">
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
                        <td className="level-cell">L{quiz.level}</td>
                        <td className="question-cell" title={quiz.question}>
                          Q: {quiz.question}
                        </td>
                        <td className="answer-cell" title={quiz.answer}>
                          A: {quiz.answer}
                        </td>
                        <td className="solution-cell" title={quiz.solution || "No solution"}>
                          {quiz.solution ? `S: ${quiz.solution}` : "No S"}
                        </td>
                        <td className="created-cell">
                          {new Date(quiz.created_at).toLocaleDateString()}
                        </td>
                        <td className="actions-cell">
                          <IonButton
                            fill="clear"
                            size="small"
                            color="primary"
                            onClick={() => openEdit(quiz)}
                            title="Edit Quiz"
                          >
                            <IonIcon icon={createOutline} />
                          </IonButton>
                          <IonButton
                            fill="clear"
                            size="small"
                            color="danger"
                            onClick={() => setDeleteId(quiz.id)}
                            title="Delete Quiz"
                          >
                            <IonIcon icon={trashOutline} />
                          </IonButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}

        {/* ✅ Delete Alert */}
        <IonAlert
          isOpen={!!deleteId}
          onDidDismiss={() => setDeleteId(null)}
          header="Confirm Delete"
          message="Are you sure you want to delete this quiz? This action cannot be undone."
          buttons={[
            { text: "Cancel", role: "cancel" },
            {
              text: "Delete",
              cssClass: "danger-button",
              handler: handleDelete,
            },
          ]}
        />

        {/* ✅ Edit Modal */}
        <IonModal
          isOpen={!!editQuiz}
          onDidDismiss={() => setEditQuiz(null)}
          className="edit-modal-content"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Quiz - Level {editLevel}</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent style={{ padding: "1rem" }}>
            <IonItem>
              <IonLabel position="stacked">Category</IonLabel>
              <IonSelect
                value={editCategory}
                onIonChange={(e) => setEditCategory(e.detail.value!)}
                interface="action-sheet"
              >
                <IonSelectOption value="Basic">Basic</IonSelectOption>
                <IonSelectOption value="Intermediate">Intermediate</IonSelectOption>
                <IonSelectOption value="Advanced">Advanced</IonSelectOption>
                {/* Add more categories as needed for Motion */}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Level</IonLabel>
              <IonInput
                type="number"
                value={editLevel}
                onIonChange={(e) => setEditLevel(parseInt(e.detail.value!) || 1)}
                min={1}
                max={10}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Question</IonLabel>
              <IonInput
                value={editQuestion}
                onIonChange={(e) => setEditQuestion(e.detail.value!)}
                placeholder="Enter the question"
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Answer</IonLabel>
              <IonInput
                value={editAnswer}
                onIonChange={(e) => setEditAnswer(e.detail.value!)}
                placeholder="Enter the correct answer"
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Solution</IonLabel>
              <IonInput
                value={editSolution}
                onIonChange={(e) => setEditSolution(e.detail.value!)}
                placeholder="Enter the solution (optional)"
              />
            </IonItem>
            <div style={{ marginTop: "1.5rem", textAlign: "center", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <IonButton color="success" onClick={handleEditSave}>
                Save Changes
              </IonButton>
              <IonButton
                color="medium"
                fill="outline"
                onClick={() => setEditQuiz(null)}
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

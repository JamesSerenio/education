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
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonTextarea,
  IonSearchbar, // Added IonSearchbar import
} from "@ionic/react";
import { createOutline, trashOutline } from "ionicons/icons";
import { supabase } from "../utils/supabaseClient";

interface Quiz {
  id: string;
  subject: string;
  category: string;
  difficulty: "Easy" | "Average" | "Difficult";
  question: string;
  solution: string | null;
  answer: string;
  accepted_answers?: string[];
  created_at: string;
}

const difficultyOrder: Record<string, number> = {
  Easy: 1,
  Average: 2,
  Difficult: 3,
};

const AdminMotionQuiz: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editQuiz, setEditQuiz] = useState<Quiz | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editSolution, setEditSolution] = useState("");
  const [editDifficulty, setEditDifficulty] = useState<"Easy" | "Average" | "Difficult">("Easy");
  const [editCategory, setEditCategory] = useState("");
  const [editAcceptedAnswers, setEditAcceptedAnswers] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // Added search query state

  // Fetch quizzes
  const fetchQuizzes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("subject", "Uniform Motion in Physics");

    if (error) {
      console.error("Error fetching quizzes:", error.message);
      setQuizzes([]);
    } else {
      // Sort by category, then difficulty
      const sorted = (data || []).sort((a, b) => {
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      });
      setQuizzes(sorted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Delete quiz
  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("quizzes").delete().eq("id", deleteId);
    if (error) console.error("Error deleting quiz:", error.message);
    else setQuizzes(quizzes.filter((q) => q.id !== deleteId));
    setDeleteId(null);
  };

  // Open edit modal
  const openEdit = (quiz: Quiz) => {
    setEditQuiz(quiz);
    setEditQuestion(quiz.question);
    setEditAnswer(quiz.answer);
    setEditSolution(quiz.solution || "");
    setEditDifficulty(quiz.difficulty);
    setEditCategory(quiz.category);
    setEditAcceptedAnswers((quiz.accepted_answers || []).join("\n"));
  };

  // Save edit
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
        difficulty: editDifficulty,
        category: editCategory,
        accepted_answers: acceptedAnswersArray,
      })
      .eq("id", editQuiz.id);

    if (error) console.error("Error updating quiz:", error.message);
    else {
      setQuizzes(
        quizzes.map((q) =>
          q.id === editQuiz.id
            ? {
                ...q,
                question: editQuestion,
                answer: editAnswer,
                solution: editSolution,
                difficulty: editDifficulty,
                category: editCategory,
                accepted_answers: acceptedAnswersArray,
              }
            : q
        )
      );
      setEditQuiz(null);
    }
  };

  // Filter quizzes based on search query
  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quiz.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (quiz.solution || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    quiz.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quiz.difficulty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group filtered quizzes by category
  const groupedQuizzes = filteredQuizzes.reduce((acc: { [key: string]: Quiz[] }, quiz) => {
    if (!acc[quiz.category]) acc[quiz.category] = [];
    acc[quiz.category].push(quiz);
    return acc;
  }, {});

  const categories = Object.keys(groupedQuizzes).sort();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Motion Quizzes</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ padding: "1rem" }}>
        <style>{`
          .quiz-table-container { margin-bottom: 2rem; width: 100%; }
          .category-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem; border-radius: 8px 8px 0 0; font-size: 1.2rem; font-weight: bold; text-align: center; }
          .table-wrapper { overflow-x: auto; }
          .quiz-table { width: 100%; border-collapse: collapse; background: white; }
          .quiz-table th, .quiz-table td { padding: 0.75rem; border-bottom: 1px solid #ddd; vertical-align: top; text-align: left; white-space: nowrap; }
          .quiz-table th { background-color: #f8f9fa; font-weight: bold; }
          .actions-cell { text-align: center; width: 90px; }
          pre { white-space: pre-wrap; word-wrap: break-word; margin: 0; font-family: inherit; }
          @media (max-width: 768px) { .quiz-table th, .quiz-table td { font-size: 12px; padding: 0.5rem; } .actions-cell { width: 70px; } }
        `}</style>

        {/* Search Bar */}
        <IonSearchbar
          value={searchQuery}
          onIonChange={(e) => setSearchQuery(e.detail.value!)}
          placeholder="Search quizzes by question, answer, solution, category, or difficulty..."
          style={{ marginBottom: "1rem" }}
        />

        {loading ? (
          <div>Loading quizzes...</div>
        ) : filteredQuizzes.length === 0 ? (
          <div>No quizzes found.</div>
        ) : (
          categories.map((category) => (
            <div key={category} className="quiz-table-container">
              <div className="category-header">
                {category} ({groupedQuizzes[category].length})
              </div>
              <div className="table-wrapper">
                <table className="quiz-table">
                  <thead>
                    <tr>
                      <th>Difficulty</th>
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
                        <td>{quiz.difficulty}</td>
                        <td><pre>{quiz.question}</pre></td>
                        <td><pre>{quiz.answer}</pre></td>
                        <td><pre>{quiz.solution || "No solution"}</pre></td>
                        <td>{new Date(quiz.created_at).toLocaleDateString()}</td>
                        <td className="actions-cell">
                          <IonButton fill="clear" size="small" color="primary" onClick={() => openEdit(quiz)}>
                            <IonIcon icon={createOutline} />
                          </IonButton>
                          <IonButton fill="clear" size="small" color="danger" onClick={() => setDeleteId(quiz.id)}>
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

        <IonModal isOpen={!!editQuiz} onDidDismiss={() => setEditQuiz(null)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Quiz</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent style={{ padding: "1rem" }}>
            <IonItem>
              <IonLabel position="stacked">Category</IonLabel>
              <IonSelect value={editCategory} onIonChange={(e) => setEditCategory(e.detail.value!)}>
                <IonSelectOption value="Problem Solving">Problem Solving</IonSelectOption>
                <IonSelectOption value="Number Solving">Number Solving</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Difficulty</IonLabel>
              <IonSelect value={editDifficulty} onIonChange={(e) => setEditDifficulty(e.detail.value!)}>
                <IonSelectOption value="Easy">Easy</IonSelectOption>
                <IonSelectOption value="Average">Average</IonSelectOption>
                <IonSelectOption value="Difficult">Difficult</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Question</IonLabel>
              <IonTextarea autoGrow value={editQuestion} onIonChange={(e) => setEditQuestion(e.detail.value!)} />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Primary Answer</IonLabel>
              <IonTextarea autoGrow value={editAnswer} onIonChange={(e) => setEditAnswer(e.detail.value!)} />
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
              <IonTextarea autoGrow value={editSolution} onIonChange={(e) => setEditSolution(e.detail.value!)} />
            </IonItem>

            <div style={{ marginTop: "1.5rem", textAlign: "center", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <IonButton color="success" onClick={handleEditSave}>Save Changes</IonButton>
              <IonButton color="medium" fill="outline" onClick={() => setEditQuiz(null)}>Cancel</IonButton>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default AdminMotionQuiz;

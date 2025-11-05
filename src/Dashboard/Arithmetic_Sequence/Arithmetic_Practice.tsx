/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef, useState } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonText,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import ArithmeticQuiz from "./arithmetic_quiz";

const Arithmetic_Practice: React.FC = () => {
  const [category, setCategory] = useState<string>("an");
  const [a1, setA1] = useState<string>("");
  const [an, setAn] = useState<string>("");
  const [n, setN] = useState<string>("");
  const [d, setD] = useState<string>("");

  const [result, setResult] = useState<string>("");
  const [steps, setSteps] = useState<string[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);

  // per-field error messages
  const [a1Error, setA1Error] = useState<string>("");
  const [anError, setAnError] = useState<string>("");
  const [nError, setNError] = useState<string>("");
  const [dError, setDError] = useState<string>("");

  // refs for focusing inputs
  const a1Ref = useRef<HTMLIonInputElement | null>(null);
  const anRef = useRef<HTMLIonInputElement | null>(null);
  const nRef = useRef<HTMLIonInputElement | null>(null);
  const dRef = useRef<HTMLIonInputElement | null>(null);

  const blockInvalidKeys = (e: React.KeyboardEvent) => {
    if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
  };

  const clearErrors = () => {
    setA1Error("");
    setAnError("");
    setNError("");
    setDError("");
  };

  const formatNumber = (v: number) =>
    Number.isInteger(v) ? v.toString() : v.toFixed(2);

  const setFieldErrorAndFocus = (
    field: "a1" | "an" | "n" | "d",
    msg: string
  ) => {
    if (field === "a1") {
      setA1Error(msg);
      a1Ref.current?.setFocus();
    } else if (field === "an") {
      setAnError(msg);
      anRef.current?.setFocus();
    } else if (field === "n") {
      setNError(msg);
      nRef.current?.setFocus();
    } else {
      setDError(msg);
      dRef.current?.setFocus();
    }
  };

  const calculate = () => {
    clearErrors();
    setResult("");
    setSteps([]);

    // check required fields
    const required = (val: string, field: "a1" | "an" | "n" | "d") => {
      if (val.trim() === "") {
        setFieldErrorAndFocus(field, "Required");
        setResult("⚠️ Please fill in all required fields.");
        return true;
      }
      return false;
    };

    // validation by category
    if (category === "an") {
      if (required(a1, "a1") || required(n, "n") || required(d, "d")) return;
    }
    if (category === "a1") {
      if (required(an, "an") || required(n, "n") || required(d, "d")) return;
    }
    if (category === "n") {
      if (required(a1, "a1") || required(an, "an") || required(d, "d")) return;
    }
    if (category === "d") {
      if (required(a1, "a1") || required(an, "an") || required(n, "n")) return;
    }

    // parse values
    const A1 = parseFloat(a1);
    const AN = parseFloat(an);
    const N = parseInt(n);
    const D = parseFloat(d);

    const newSteps: string[] = [];

    try {
      if (category === "an") {
        const computed = A1 + (N - 1) * D;
        newSteps.push(`Formula: aₙ = a₁ + (n − 1) × d`);
        newSteps.push(
          `Substitute: aₙ = ${A1} + (${N} − 1) × ${D} = ${computed}`
        );
        setSteps(newSteps);
        setResult(`aₙ = ${formatNumber(computed)}`);
      } else if (category === "a1") {
        const computed = AN - (N - 1) * D;
        newSteps.push(`Formula: a₁ = aₙ − (n − 1) × d`);
        newSteps.push(
          `Substitute: a₁ = ${AN} − (${N} − 1) × ${D} = ${computed}`
        );
        setSteps(newSteps);
        setResult(`a₁ = ${formatNumber(computed)}`);
      } else if (category === "n") {
        const computed = (AN - A1) / D + 1;
        newSteps.push(`Formula: n = (aₙ − a₁) / d + 1`);
        newSteps.push(
          `Substitute: n = (${AN} − ${A1}) / ${D} + 1 = ${computed}`
        );
        setSteps(newSteps);
        setResult(`n = ${formatNumber(computed)}`);
      } else if (category === "d") {
        const computed = (AN - A1) / (N - 1);
        newSteps.push(`Formula: d = (aₙ − a₁) / (n − 1)`);
        newSteps.push(
          `Substitute: d = (${AN} − ${A1}) / (${N} − 1) = ${computed}`
        );
        setSteps(newSteps);
        setResult(`d = ${formatNumber(computed)}`);
      }
    } catch {
      setResult("⚠️ Invalid input or computation error.");
    }
  };

  const resetAll = () => {
    setA1("");
    setAn("");
    setN("");
    setD("");
    setResult("");
    setSteps([]);
    clearErrors();
  };

  if (showQuiz) {
    return <ArithmeticQuiz />;
  }

  return (
    <IonPage className="arithmetic-practice">
      <IonHeader>
        <IonToolbar className="gradient-toolbar">
          <IonTitle className="title">Let's Practice First</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding gradient-background">
        <div className="practice-card">
          <IonItem className="custom-item">
            <IonLabel>Choose Category</IonLabel>
            <IonSelect
              value={category}
              onIonChange={(e) => {
                setCategory(e.detail.value);
                setResult("");
                setSteps([]);
                clearErrors();
              }}
            >
              <IonSelectOption value="an">Find aₙ</IonSelectOption>
              <IonSelectOption value="a1">Find a₁</IonSelectOption>
              <IonSelectOption value="n">Find n</IonSelectOption>
              <IonSelectOption value="d">Find d</IonSelectOption>
            </IonSelect>
          </IonItem>

          {/* Inputs */}
          {category !== "a1" && (
            <IonItem className="custom-item">
              <IonLabel position="stacked">a₁</IonLabel>
              <IonInput
                ref={a1Ref}
                type="number"
                inputMode="decimal"
                value={a1}
                onIonChange={(e) => setA1(e.detail.value ?? "")}
                onKeyDown={blockInvalidKeys}
              />
              {a1Error && <IonText color="danger">{a1Error}</IonText>}
            </IonItem>
          )}

          {category !== "an" && (
            <IonItem className="custom-item">
              <IonLabel position="stacked">aₙ</IonLabel>
              <IonInput
                ref={anRef}
                type="number"
                inputMode="decimal"
                value={an}
                onIonChange={(e) => setAn(e.detail.value ?? "")}
                onKeyDown={blockInvalidKeys}
              />
              {anError && <IonText color="danger">{anError}</IonText>}
            </IonItem>
          )}

          {category !== "n" && (
            <IonItem className="custom-item">
              <IonLabel position="stacked">n</IonLabel>
              <IonInput
                ref={nRef}
                type="number"
                inputMode="numeric"
                value={n}
                onIonChange={(e) => setN(e.detail.value ?? "")}
                onKeyDown={blockInvalidKeys}
              />
              {nError && <IonText color="danger">{nError}</IonText>}
            </IonItem>
          )}

          {category !== "d" && (
            <IonItem className="custom-item">
              <IonLabel position="stacked">d</IonLabel>
              <IonInput
                ref={dRef}
                type="number"
                inputMode="decimal"
                value={d}
                onIonChange={(e) => setD(e.detail.value ?? "")}
                onKeyDown={blockInvalidKeys}
              />
              {dError && <IonText color="danger">{dError}</IonText>}
            </IonItem>
          )}

          {/* Buttons */}
          <div className="btn-group">
            <IonButton className="gradient-btn" onClick={calculate}>
              Solve
            </IonButton>
            <IonButton color="medium" onClick={resetAll}>
              Reset
            </IonButton>
            <IonButton className="gradient-btn" onClick={() => setShowQuiz(true)}>
              Proceed to Quiz
            </IonButton>
          </div>

          {/* Step-by-step */}
          {steps.length > 0 && (
            <div className="solution-box">
              <h3>Solution:</h3>
              <ol>
                {steps.map((s, i) => (
                  <li key={i}>
                    <IonText color="dark">{s}</IonText>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Final Answer Box */}
          {result && (
            <div className="answer-box">
              <IonText color="dark">
                <strong>{result}</strong>
              </IonText>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Arithmetic_Practice;

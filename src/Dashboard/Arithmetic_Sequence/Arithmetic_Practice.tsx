import React, { useState } from "react";
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

const Arithmetic_Practice: React.FC = () => {
  const [category, setCategory] = useState<string>("an");
  const [a1, setA1] = useState<string>("");
  const [an, setAn] = useState<string>("");
  const [n, setN] = useState<string>("");
  const [d, setD] = useState<string>("");

  const [result, setResult] = useState<string>("");

  // Block letters like e, E, +, -
  const blockInvalidKeys = (e: React.KeyboardEvent) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const calculate = () => {
    // Check required inputs based on category before parsing
    const inputsMissing = () => {
      switch (category) {
        case "an":
          return a1.trim() === "" || n.trim() === "" || d.trim() === "";
        case "a1":
          return an.trim() === "" || n.trim() === "" || d.trim() === "";
        case "n":
          return an.trim() === "" || a1.trim() === "" || d.trim() === "";
        case "d":
          return an.trim() === "" || a1.trim() === "" || n.trim() === "";
        default:
          return true;
      }
    };

    if (inputsMissing()) {
      setResult("⚠️ No numbers input. Please fill all required fields.");
      return;
    }

    try {
      const A1 = parseFloat(a1);
      const AN = parseFloat(an);
      const N = parseInt(n);
      const D = parseFloat(d);

      let answer = "";

      switch (category) {
        case "an":
          if (isNaN(A1) || isNaN(N) || isNaN(D))
            throw new Error("Invalid inputs");
          answer = `aₙ = ${A1} + (${N}-1)(${D}) = ${A1 + (N - 1) * D}`;
          break;

        case "a1":
          if (isNaN(AN) || isNaN(N) || isNaN(D))
            throw new Error("Invalid inputs");
          answer = `a₁ = aₙ - (n-1)d = ${AN} - (${N}-1)(${D}) = ${
            AN - (N - 1) * D
          }`;
          break;

        case "n": {
          if (isNaN(AN) || isNaN(A1) || isNaN(D) || D === 0)
            throw new Error("Invalid inputs");
          const nVal = (AN - A1) / D + 1;
          if (!Number.isInteger(nVal) || nVal <= 0)
            throw new Error("n must be a positive integer");
          answer = `n = (aₙ - a₁)/d + 1 = (${AN} - ${A1})/${D} + 1 = ${nVal}`;
          break;
        }

        case "d":
          if (isNaN(AN) || isNaN(A1) || isNaN(N) || N <= 1)
            throw new Error("Invalid inputs");
          answer = `d = (aₙ - a₁)/(n-1) = (${AN} - ${A1})/(${N}-1) = ${
            (AN - A1) / (N - 1)
          }`;
          break;

        default:
          throw new Error("Invalid category");
      }

      setResult(answer);
    } catch {
      setResult("⚠️ That number is not valid for this formula.");
    }
  };

  const resetAll = () => {
    setA1("");
    setAn("");
    setN("");
    setD("");
    setResult("");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Let's Practice First</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* Select Category */}
        <IonItem>
          <IonLabel>Choose Category</IonLabel>
          <IonSelect
            value={category}
            placeholder="Select One"
            onIonChange={(e) => {
              setCategory(e.detail.value);
              setResult("");
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
          <IonItem>
            <IonLabel position="stacked">a₁</IonLabel>
            <IonInput
              type="number"
              inputMode="decimal"
              value={a1}
              onKeyDown={blockInvalidKeys}
              onIonChange={(e) => setA1(e.detail.value ?? "")}
            />
          </IonItem>
        )}
        {category !== "an" && (
          <IonItem>
            <IonLabel position="stacked">aₙ</IonLabel>
            <IonInput
              type="number"
              inputMode="decimal"
              value={an}
              onKeyDown={blockInvalidKeys}
              onIonChange={(e) => setAn(e.detail.value ?? "")}
            />
          </IonItem>
        )}
        {category !== "n" && (
          <IonItem>
            <IonLabel position="stacked">n</IonLabel>
            <IonInput
              type="number"
              inputMode="numeric"
              value={n}
              onKeyDown={blockInvalidKeys}
              onIonChange={(e) => setN(e.detail.value ?? "")}
            />
          </IonItem>
        )}
        {category !== "d" && (
          <IonItem>
            <IonLabel position="stacked">d</IonLabel>
            <IonInput
              type="number"
              inputMode="decimal"
              value={d}
              onKeyDown={blockInvalidKeys}
              onIonChange={(e) => setD(e.detail.value ?? "")}
            />
          </IonItem>
        )}

        {/* Buttons (Solve + Reset centered side by side) */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <IonButton color="primary" onClick={calculate}>
            Solve
          </IonButton>
          <IonButton color="medium" onClick={resetAll}>
            Reset
          </IonButton>
        </div>

        {/* Result */}
        {result && (
          <IonText color="dark">
            <h2 style={{ marginTop: "20px" }}>{result}</h2>
          </IonText>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Arithmetic_Practice;

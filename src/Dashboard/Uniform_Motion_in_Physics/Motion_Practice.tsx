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

const Motion_Practice: React.FC = () => {
  const [category, setCategory] = useState<string>("v");
  const [v, setV] = useState<string>("");
  const [dx, setDx] = useState<string>("");
  const [dt, setDt] = useState<string>("");

  const [result, setResult] = useState<string>("");

  // Prevent typing invalid keys
  const blockInvalidKeys = (e: React.KeyboardEvent) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const calculate = () => {
    const inputsMissing = () => {
      switch (category) {
        case "v":
          return dx.trim() === "" || dt.trim() === "";
        case "dx":
          return v.trim() === "" || dt.trim() === "";
        case "dt":
          return v.trim() === "" || dx.trim() === "";
        default:
          return true;
      }
    };

    if (inputsMissing()) {
      setResult("⚠️ No numbers input. Please fill all required fields.");
      return;
    }

    try {
      const V = parseFloat(v);
      const DX = parseFloat(dx);
      const DT = parseFloat(dt);

      let answer = "";

      switch (category) {
        case "v":
          if (isNaN(DX) || isNaN(DT) || DT === 0)
            throw new Error("Invalid inputs");
          answer = `v = Δx / Δt = ${DX} / ${DT} = ${DX / DT} m/s`;
          break;

        case "dx":
          if (isNaN(V) || isNaN(DT))
            throw new Error("Invalid inputs");
          answer = `Δx = v × Δt = ${V} × ${DT} = ${V * DT} m`;
          break;

        case "dt":
          if (isNaN(V) || isNaN(DX) || V === 0)
            throw new Error("Invalid inputs");
          answer = `Δt = Δx / v = ${DX} / ${V} = ${DX / V} s`;
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
    setV("");
    setDx("");
    setDt("");
    setResult("");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Uniform Motion Practice</IonTitle>
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
            <IonSelectOption value="v">Find v (velocity)</IonSelectOption>
            <IonSelectOption value="dx">Find Δx (displacement)</IonSelectOption>
            <IonSelectOption value="dt">Find Δt (time)</IonSelectOption>
          </IonSelect>
        </IonItem>

        {/* Inputs */}
        {category !== "v" && (
          <IonItem>
            <IonLabel position="stacked">v (m/s)</IonLabel>
            <IonInput
              type="number"
              inputMode="decimal"
              value={v}
              onKeyDown={blockInvalidKeys}
              onIonChange={(e) => setV(e.detail.value ?? "")}
            />
          </IonItem>
        )}
        {category !== "dx" && (
          <IonItem>
            <IonLabel position="stacked">Δx (m)</IonLabel>
            <IonInput
              type="number"
              inputMode="decimal"
              value={dx}
              onKeyDown={blockInvalidKeys}
              onIonChange={(e) => setDx(e.detail.value ?? "")}
            />
          </IonItem>
        )}
        {category !== "dt" && (
          <IonItem>
            <IonLabel position="stacked">Δt (s)</IonLabel>
            <IonInput
              type="number"
              inputMode="decimal"
              value={dt}
              onKeyDown={blockInvalidKeys}
              onIonChange={(e) => setDt(e.detail.value ?? "")}
            />
          </IonItem>
        )}

        {/* Buttons (Solve + Reset) */}
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

export default Motion_Practice;

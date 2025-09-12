import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const Arithmetic_Radar: React.FC = () => {
  const alumniRadarRef = useRef<HTMLCanvasElement | null>(null);
  const programRadarRef = useRef<HTMLCanvasElement | null>(null);
  const alumniChartInstance = useRef<Chart | null>(null);
  const programChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    fetch("data.json")
      .then((response) => response.json())
      .then((data) => {
        const commonOptions = {
          responsive: true,
          scales: {
            r: {
              angleLines: { display: true },
              suggestedMin: 0,
              suggestedMax: 100,
              ticks: {
                stepSize: 20,
                backdropColor: "transparent",
              },
              pointLabels: {
                font: {
                  size: 14,
                },
              },
            },
          },
          plugins: {
            legend: {
              position: "top" as const,
            },
          },
        };

        if (alumniRadarRef.current) {
          if (alumniChartInstance.current) {
            alumniChartInstance.current.destroy();
          }
          alumniChartInstance.current = new Chart(alumniRadarRef.current, {
            type: "radar",
            data: {
              labels: data.alumniChart.labels,
              datasets: data.alumniChart.datasets,
            },
            options: commonOptions,
          });
        }

        if (programRadarRef.current) {
          if (programChartInstance.current) {
            programChartInstance.current.destroy();
          }
          programChartInstance.current = new Chart(programRadarRef.current, {
            type: "radar",
            data: {
              labels: data.programChart.labels,
              datasets: data.programChart.datasets,
            },
            options: commonOptions,
          });
        }
      })
      .catch((error) => console.error("Error loading chart data:", error));

    // Cleanup charts on unmount
    return () => {
      alumniChartInstance.current?.destroy();
      programChartInstance.current?.destroy();
    };
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Arithmetic Radar Charts</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen style={{ backgroundColor: "#f8f9fa" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            padding: "1rem",
          }}
        >
          <div
            style={{
              width: "45%",
              margin: "10px",
              padding: "20px",
              backgroundColor: "#fff",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
              Alumni Characteristics Radar Chart
            </h2>
            <canvas ref={alumniRadarRef} />
          </div>

          <div
            style={{
              width: "45%",
              margin: "10px",
              padding: "20px",
              backgroundColor: "#fff",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
              Program & Curriculum Contribution
            </h2>
            <canvas ref={programRadarRef} />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Arithmetic_Radar;

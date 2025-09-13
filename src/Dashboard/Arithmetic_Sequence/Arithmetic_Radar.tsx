import {
  IonPage,
  IonHeader,
  IonContent,
} from "@ionic/react";
import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const Arithmetic_Radar: React.FC = () => {
  const radarRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (radarRef.current) {
      const ctx = radarRef.current.getContext("2d");
      if (!ctx) return;

      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new ChartJS(ctx, {
        type: "radar",
        data: {
          labels: ["Time", "Problem Solving", "Solving"],
          datasets: [
            {
              label: "My Performance",
              data: [65, 80, 72],
              fill: true,
              backgroundColor: "rgba(54, 162, 235, 0.2)",
              borderColor: "rgb(54, 162, 235)",
              pointBackgroundColor: "rgb(54, 162, 235)",
              pointBorderColor: "#fff",
              pointHoverBackgroundColor: "#fff",
              pointHoverBorderColor: "rgb(54, 162, 235)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              angleLines: { display: true },
              suggestedMin: 0,
              suggestedMax: 100,
            },
          },
        },
      });
    }

    return () => {
      chartInstance.current?.destroy();
    };
  }, []);

  return (
    <IonPage>
      <IonHeader>
        {/* Optional header content */}
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: "20px" }}>
          <div style={{ width: "100%", height: "650px", marginTop: "60px" }}>
            <canvas ref={radarRef} />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Arithmetic_Radar;

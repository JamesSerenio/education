import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { chevronDownOutline, chevronUpOutline } from "ionicons/icons";
import { supabase } from "../utils/supabaseClient";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface UserStats {
  admin: number;
  user: number;
  total: number;
}

interface LoginLog {
  id: string;
  email: string;
  role: string;
  login_at: string;
}

interface ActivityDay {
  day: string;
  arithmetic: number;
  motion: number;
}

const AdminHome: React.FC = () => {
  const [stats, setStats] = useState<UserStats>({ admin: 0, user: 0, total: 0 });
  const [animatedStats, setAnimatedStats] = useState<UserStats>({ admin: 0, user: 0, total: 0 });
  const [recentLogins, setRecentLogins] = useState<LoginLog[]>([]);
  const [activityData, setActivityData] = useState<ActivityDay[]>([]);

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date(2025, 9, 1);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  });

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;

  useEffect(() => {
    const fetchStats = async () => {
      const { count: adminCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("role", "admin");
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("role", "user");

      setStats({
        admin: adminCount || 0,
        user: userCount || 0,
        total: (adminCount || 0) + (userCount || 0),
      });
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    let step = 0;
    const incrementAdmin = stats.admin / steps;
    const incrementUser = stats.user / steps;
    const incrementTotal = stats.total / steps;

    const interval = setInterval(() => {
      step++;
      setAnimatedStats({
        admin: Math.min(Math.round(incrementAdmin * step), stats.admin),
        user: Math.min(Math.round(incrementUser * step), stats.user),
        total: Math.min(Math.round(incrementTotal * step), stats.total),
      });
      if (step >= steps) clearInterval(interval);
    }, duration / steps);

    return () => clearInterval(interval);
  }, [stats]);

  useEffect(() => {
    const fetchLogins = async () => {
      const { data, error } = await supabase
        .from("login_logs")
        .select("*")
        .order("login_at", { ascending: false });
      if (!error && data) setRecentLogins(data);
    };
    fetchLogins();
  }, []);

  const fetchActivity = async (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const { data, error } = await supabase
      .from("scores")
      .select("created_at, quizzes(subject)")
      .gte("created_at", weekStart.toISOString())
      .lte("created_at", weekEnd.toISOString());

    if (error) {
      console.error("Error fetching quiz activity:", error);
      return;
    }

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const counts: Record<string, { arithmetic: number; motion: number }> = {};
    days.forEach((d) => (counts[d] = { arithmetic: 0, motion: 0 }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?.forEach((row: any) => {
      const day = days[new Date(row.created_at).getDay()];
      const subject = row.quizzes?.subject?.toLowerCase() || "";
      if (subject.includes("arithmetic")) counts[day].arithmetic++;
      else if (subject.includes("motion")) counts[day].motion++;
    });

    const formatted = days.map((d) => ({
      day: d,
      arithmetic: counts[d].arithmetic,
      motion: counts[d].motion,
    }));

    setActivityData(formatted);
  };

  useEffect(() => {
    fetchActivity(currentWeekStart);
  }, [currentWeekStart]);

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const formatDateRange = (start: Date) => {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    const month = monthNames[start.getMonth()];
    const year = start.getFullYear();
    const startDay = start.getDate();
    const endDay = end.getDate();
    return `${month} ${startDay}–${endDay}, ${year}`;
  };

      const chartData = {
        labels: activityData.map((d) => d.day),
        datasets: [
          {
            label: "Arithmetic Quiz",
            data: activityData.map((d) => d.arithmetic),
            borderColor: "rgba(54, 162, 235, 1)",
            backgroundColor: "transparent",
            fill: false,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: window.innerWidth < 600 ? 6 : 5, // bigger on mobile
            pointHoverRadius: window.innerWidth < 600 ? 8 : 7,
            pointHitRadius: window.innerWidth < 600 ? 15 : 5, // touch-friendly
            pointBackgroundColor: "rgba(54,162,235,1)",
          },
          {
            label: "Motion Quiz",
            data: activityData.map((d) => d.motion),
            borderColor: "rgba(255, 99, 132, 1)",
            backgroundColor: "transparent",
            fill: false,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: window.innerWidth < 600 ? 6 : 5,
            pointHoverRadius: window.innerWidth < 600 ? 8 : 7,
            pointHitRadius: window.innerWidth < 600 ? 15 : 5,
            pointBackgroundColor: "rgba(255,99,132,1)",
          },
        ],
      };

      const chartOptions: ChartOptions<"line"> = {
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: window.devicePixelRatio || 1,
        interaction: {
          mode: "nearest", // better on mobile (touch-friendly)
          intersect: true,
        },
        plugins: {
          legend: { position: "top" },
          title: {
            display: true,
            text: "Weekly Quiz Activity",
            font: { size: 18, weight: "bold" },
          },
          tooltip: {
            mode: "nearest",
            intersect: true,
            backgroundColor: "rgba(0,0,0,0.8)",
            titleFont: { size: 13 },
            bodyFont: { size: 12 },
            padding: 8,
            callbacks: {
              title: (tooltipItems) => {
                const item = tooltipItems[0];
                const dayIndex = item.dataIndex;
                const date = new Date(currentWeekStart);
                date.setDate(currentWeekStart.getDate() + dayIndex);
                return `${item.label} (${date.toLocaleDateString()})`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            ticks: { stepSize: 1 },
            grid: { color: "rgba(200,200,200,0.3)" },
            title: { display: true, text: "Number of Participants" },
          },
          x: {
            grid: { color: "rgba(200,200,200,0.2)" },
            title: { display: true, text: "Day of the Week" },
          },
        },
      };

  const totalItems = recentLogins.length;
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentLogs = recentLogins.slice(startIndex, endIndex);

  const handleNext = () => {
    if (endIndex < totalItems) setCurrentPage((prev) => prev + 1);
  };
  const handlePrev = () => {
    if (currentPage > 0) setCurrentPage((prev) => prev - 1);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding admin-home">
        <h2 className="welcome-title">
          Welcome, <b>Admin</b>
        </h2>

        {/* === USER STATS === */}
        <IonGrid className="stats-grid">
          <IonRow>
            <IonCol size="12" sizeMd="4">
              <IonCard className="card-admin">
                <IonCardHeader><IonCardTitle>Admin Users</IonCardTitle></IonCardHeader>
                <IonCardContent><h1>{animatedStats.admin}</h1></IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol size="12" sizeMd="4">
              <IonCard className="card-users">
                <IonCardHeader><IonCardTitle>Users</IonCardTitle></IonCardHeader>
                <IonCardContent><h1>{animatedStats.user}</h1></IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol size="12" sizeMd="4">
              <IonCard className="card-total">
                <IonCardHeader><IonCardTitle>Total Users</IonCardTitle></IonCardHeader>
                <IonCardContent><h1>{animatedStats.total}</h1></IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* === CHART SECTION === */}
        <div className="chart-section">
          <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="chart-title">Weekly Quiz Activity</h3>
            <div className="week-selector" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem" }}>
              <IonButton fill="clear" onClick={handlePrevWeek}><IonIcon icon={chevronUpOutline} /></IonButton>
              <span>{formatDateRange(currentWeekStart)}</span>
              <IonButton fill="clear" onClick={handleNextWeek}><IonIcon icon={chevronDownOutline} /></IonButton>
            </div>
          </div>

          <div className="chart-container" style={{ height: "400px", marginTop: "10px" }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* === RECENT LOGINS === */}
        <h3 className="section-title">Recent Logins</h3>
        <IonGrid className="recent-login-table">
          <IonRow className="table-header">
            <IonCol>Email</IonCol>
            <IonCol>Role</IonCol>
            <IonCol>Date & Time</IonCol>
          </IonRow>

          {currentLogs.map((login) => (
            <IonRow key={login.id} className="table-row">
              <IonCol>{login.email}</IonCol>
              <IonCol className="text-center">{login.role}</IonCol>
              <IonCol className="text-end">{new Date(login.login_at).toLocaleString()}</IonCol>
            </IonRow>
          ))}

          <IonRow className="pagination-row">
            <IonButton fill="clear" disabled={currentPage === 0} onClick={handlePrev}>
              <IonIcon icon={chevronUpOutline} />
            </IonButton>
            <span className="pagination-count">
              {endIndex}/{totalItems}
            </span>
            <IonButton fill="clear" disabled={endIndex >= totalItems} onClick={handleNext}>
              <IonIcon icon={chevronDownOutline} />
            </IonButton>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default AdminHome;

import React, { useEffect, useState } from "react";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from "@ionic/react";
import { motion } from "framer-motion";
import { supabase } from "../utils/supabaseClient";

interface UserStats {
  admin: number;
  user: number;
  total: number;
}

interface LoginLog {
  id: string;
  email: string;
  role: string;
  logged_in_at: string;
}

const AdminHome: React.FC = () => {
  const [stats, setStats] = useState<UserStats>({ admin: 0, user: 0, total: 0 });
  const [animatedStats, setAnimatedStats] = useState<UserStats>({ admin: 0, user: 0, total: 0 });
  const [recentLogins, setRecentLogins] = useState<LoginLog[]>([]);

  // Fetch stats
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

  // Animate numbers counting up
  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const incrementAdmin = stats.admin / steps;
    const incrementUser = stats.user / steps;
    const incrementTotal = stats.total / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setAnimatedStats({
        admin: Math.min(Math.round(incrementAdmin * currentStep), stats.admin),
        user: Math.min(Math.round(incrementUser * currentStep), stats.user),
        total: Math.min(Math.round(incrementTotal * currentStep), stats.total),
      });
      if (currentStep >= steps) clearInterval(interval);
    }, duration / steps);

    return () => clearInterval(interval);
  }, [stats]);

  // Fetch recent logins
  useEffect(() => {
    const fetchLogins = async () => {
      const { data, error } = await supabase
        .from("login_logs")
        .select("*")
        .order("logged_in_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setRecentLogins(data);
      }
    };

    fetchLogins();
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.2, duration: 0.6 },
    }),
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <h2 style={{ marginBottom: "20px" }}>Welcome, <b>Admin</b></h2>

        {/* Stats Cards */}
        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="4">
              <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
                <IonCard style={{ borderRadius: "15px", boxShadow: "0 8px 20px rgba(0,0,0,0.2)", background: "linear-gradient(135deg, #28a745, #85e085)" }}>
                  <IonCardHeader>
                    <IonCardTitle style={{ color: "#fff", fontWeight: "bold" }}>Admin Users</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <h1 style={{ color: "#fff", fontSize: "2.5rem", fontWeight: "bold" }}>{animatedStats.admin}</h1>
                  </IonCardContent>
                </IonCard>
              </motion.div>
            </IonCol>

            <IonCol size="12" sizeMd="4">
              <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
                <IonCard style={{ borderRadius: "15px", boxShadow: "0 8px 20px rgba(0,0,0,0.2)", background: "linear-gradient(135deg, #007bff, #66c2ff)" }}>
                  <IonCardHeader>
                    <IonCardTitle style={{ color: "#fff", fontWeight: "bold" }}>Users</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <h1 style={{ color: "#fff", fontSize: "2.5rem", fontWeight: "bold" }}>{animatedStats.user}</h1>
                  </IonCardContent>
                </IonCard>
              </motion.div>
            </IonCol>

            <IonCol size="12" sizeMd="4">
              <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
                <IonCard style={{ borderRadius: "15px", boxShadow: "0 8px 20px rgba(0,0,0,0.2)", background: "linear-gradient(135deg, #ffc107, #ffe066)" }}>
                  <IonCardHeader>
                    <IonCardTitle style={{ color: "#fff", fontWeight: "bold" }}>Total Users</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <h1 style={{ color: "#fff", fontSize: "2.5rem", fontWeight: "bold" }}>{animatedStats.total}</h1>
                  </IonCardContent>
                </IonCard>
              </motion.div>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Recent Logins Table */}
        <h3 style={{ marginTop: "30px", marginBottom: "15px" }}>Recent Logins</h3>
        <IonGrid>
          <IonRow style={{ fontWeight: "bold", borderBottom: "2px solid #ccc", paddingBottom: "10px" }}>
            <IonCol>Email</IonCol>
            <IonCol>Role</IonCol>
            <IonCol>Date & Time</IonCol>
          </IonRow>
          {recentLogins.map((login) => (
            <IonRow key={login.id} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
              <IonCol>{login.email}</IonCol>
              <IonCol>{login.role}</IonCol>
              <IonCol>{new Date(login.logged_in_at).toLocaleString()}</IonCol>
            </IonRow>
          ))}
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default AdminHome;

import React, { useEffect, useState } from "react";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from "@ionic/react";
import { motion } from "framer-motion";
import { supabase } from "../utils/supabaseClient";

interface UserStats {
  admin: number;
  user: number;
  total: number;
}

const AdminHome: React.FC = () => {
  const [stats, setStats] = useState<UserStats>({
    admin: 0,
    user: 0,
    total: 0,
  });

  const [animatedStats, setAnimatedStats] = useState<UserStats>({
    admin: 0,
    user: 0,
    total: 0,
  });

  // Fetch stats from Supabase
  useEffect(() => {
    const fetchStats = async () => {
      // Count admin users
      const { count: adminCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("role", "admin");

      // Count regular users
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("role", "user");

      const totalCount = (adminCount || 0) + (userCount || 0);

      setStats({
        admin: adminCount || 0,
        user: userCount || 0,
        total: totalCount,
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
            {/* Admin Users */}
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

            {/* Users */}
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

            {/* Total Users */}
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
      </IonContent>
    </IonPage>
  );
};

export default AdminHome;


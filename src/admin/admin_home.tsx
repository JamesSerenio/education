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
import { motion, AnimatePresence } from "framer-motion";
import { chevronDownOutline, chevronUpOutline } from "ionicons/icons";
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
  login_at: string;
}

const AdminHome: React.FC = () => {
  const [stats, setStats] = useState<UserStats>({ admin: 0, user: 0, total: 0 });
  const [animatedStats, setAnimatedStats] = useState<UserStats>({ admin: 0, user: 0, total: 0 });
  const [recentLogins, setRecentLogins] = useState<LoginLog[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;

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

  // Animate numbers
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

  // Fetch logins
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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.2, duration: 0.6 },
    }),
  };

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
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

        {/* Stats Section */}
        <IonGrid className="stats-grid">
          <IonRow>
            <IonCol size="12" sizeMd="4">
              <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
                <IonCard className="card-admin">
                  <IonCardHeader>
                    <IonCardTitle>Admin Users</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <h1>{animatedStats.admin}</h1>
                  </IonCardContent>
                </IonCard>
              </motion.div>
            </IonCol>

            <IonCol size="12" sizeMd="4">
              <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
                <IonCard className="card-users">
                  <IonCardHeader>
                    <IonCardTitle>Users</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <h1>{animatedStats.user}</h1>
                  </IonCardContent>
                </IonCard>
              </motion.div>
            </IonCol>

            <IonCol size="12" sizeMd="4">
              <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
                <IonCard className="card-total">
                  <IonCardHeader>
                    <IonCardTitle>Total Users</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <h1>{animatedStats.total}</h1>
                  </IonCardContent>
                </IonCard>
              </motion.div>
            </IonCol>
          </IonRow>
        </IonGrid>

        <h3 className="section-title">Recent Logins</h3>

        <IonGrid>
          {/* Header */}
          <IonRow className="table-header">
            <IonCol size="6" sizeMd="6">Email</IonCol>
            <IonCol size="3" sizeMd="3">Role</IonCol>
            <IonCol size="3" sizeMd="3">Date & Time</IonCol>
          </IonRow>

          {/* Animate whole page */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage} // important: triggers exit/enter when page changes
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={pageVariants}
              style={{ width: "100%" }}
            >
              {currentLogs.map((login) => (
                <IonRow key={login.id} className="recent-login-card">
                  <IonCol size="6">{login.email}</IonCol>
                  <IonCol size="3" className="text-center">{login.role}</IonCol>
                  <IonCol size="3" className="text-end">
                    {new Date(login.login_at).toLocaleString()}
                  </IonCol>
                </IonRow>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Pagination */}
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

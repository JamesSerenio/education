import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

import Dashboard_Arithmetic from "./Dashboard/Arithmetic_Sequence/Dashboard_Arithmetic";
import Dashboard_Motion from "./Dashboard/Uniform_Motion_in_Physics/Dashboard_Motion";
import Arithmetic_Practice from "./Dashboard/Arithmetic_Sequence/Arithmetic_Practice";

import ArithmeticHome from "./Dashboard/Arithmetic_Sequence/Arithmetic_Home";
import ArithmeticModule from "./Dashboard/Arithmetic_Sequence/Arithmetic_Module";
import ArithmeticLeaderboard from "./Dashboard/Arithmetic_Sequence/Arithmetic_Leaderboard";
import ArithmeticRadar from "./Dashboard/Arithmetic_Sequence/Arithmetic_Radar";
import ArithmeticQuiz from "./Dashboard/Arithmetic_Sequence/arithmetic_quiz";

import MotionQuiz from "./Dashboard/Uniform_Motion_in_Physics/motion_quiz";
import MotionPractice from "./Dashboard/Uniform_Motion_in_Physics/Motion_Practice";
import AdminDashboard from "./admin/admin_dashboard";

/* CSS */
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/display.css";
import "@ionic/react/css/palettes/dark.system.css";

import "./global.css";
import "./theme/variables.css";

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    {/* ✅ useHash no longer supported directly in v6, use HashRouter instead if needed */}
    <IonReactRouter>
      <IonRouterOutlet>
        <Routes>
          {/* Auth */}
          <Route path="/education/login" element={<Login />} />
          <Route path="/education/register" element={<Register />} />
          <Route path="/education/home" element={<Home />} />

          {/* Dashboards */}
          <Route
            path="/education/dashboard_arithmetic"
            element={<Dashboard_Arithmetic />}
          />
          <Route
            path="/education/dashboard_motion"
            element={<Dashboard_Motion />}
          />

          {/* Arithmetic */}
          <Route
            path="/education/arithmetic_practice"
            element={<Arithmetic_Practice />}
          />
          <Route
            path="/education/arithmetic_home"
            element={<ArithmeticHome />}
          />
          <Route
            path="/education/arithmetic_module"
            element={<ArithmeticModule />}
          />
          <Route
            path="/education/arithmetic_leaderboard"
            element={<ArithmeticLeaderboard />}
          />
          <Route
            path="/education/arithmetic_radar"
            element={<ArithmeticRadar />}
          />
          <Route
            path="/education/arithmetic_quiz"
            element={<ArithmeticQuiz />}
          />

          {/* Motion */}
          <Route
            path="/education/motion_practice"
            element={<MotionPractice />}
          />
          <Route path="/education/motion_quiz" element={<MotionQuiz />} />

          {/* Admin */}
          <Route
            path="/education/admin/admin_dashboard"
            element={<AdminDashboard />}
          />

          {/* Default redirect */}
          <Route
            path="/education"
            element={<Navigate to="/education/login" replace />}
          />
        </Routes>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;

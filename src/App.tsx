import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { HashRouter as Router, Route, Redirect } from "react-router-dom";

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

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
import "@ionic/react/css/palettes/dark.system.css";

import "./global.css";
import "./theme/variables.css";

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    {/* ✅ HashRouter fixes GitHub Pages refresh issues */}
    <Router>
      <IonRouterOutlet>
        {/* Auth */}
        <Route exact path="/education/login" component={Login} />
        <Route exact path="/education/register" component={Register} />

        {/* Home */}
        <Route exact path="/education/home" component={Home} />

        {/* Dashboards */}
        <Route
          exact
          path="/education/dashboard_arithmetic"
          component={Dashboard_Arithmetic}
        />
        <Route
          exact
          path="/education/dashboard_motion"
          component={Dashboard_Motion}
        />

        {/* Arithmetic */}
        <Route
          exact
          path="/education/arithmetic_practice"
          component={Arithmetic_Practice}
        />
        <Route
          exact
          path="/education/arithmetic_home"
          component={ArithmeticHome}
        />
        <Route
          exact
          path="/education/arithmetic_module"
          component={ArithmeticModule}
        />
        <Route
          exact
          path="/education/arithmetic_leaderboard"
          component={ArithmeticLeaderboard}
        />
        <Route
          exact
          path="/education/arithmetic_radar"
          component={ArithmeticRadar}
        />
        <Route
          exact
          path="/education/arithmetic_quiz"
          component={ArithmeticQuiz}
        />

        {/* Motion */}
        <Route
          exact
          path="/education/motion_practice"
          component={MotionPractice}
        />
        <Route exact path="/education/motion_quiz" component={MotionQuiz} />

        {/* Admin */}
        <Route
          exact
          path="/education/admin/admin_dashboard"
          component={AdminDashboard}
        />

        {/* Default redirect */}
        <Route exact path="/">
          <Redirect to="/education/login" />
        </Route>
      </IonRouterOutlet>
    </Router>
  </IonApp>
);

export default App;

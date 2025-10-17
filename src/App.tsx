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
    {}
    <Router>
      <IonRouterOutlet>
        {/* Auth */}
        <Route exact path="/login" component={Login} />
        <Route exact path="/register" component={Register} />

        {/* Home */}
        <Route exact path="#/home" component={Home} />

        {/* Dashboards */}
        <Route
          exact
          path="/dashboard_arithmetic"
          component={Dashboard_Arithmetic}
        />
        <Route
          exact
          path="/dashboard_motion"
          component={Dashboard_Motion}
        />

        {/* Arithmetic */}
        <Route
          exact
          path="/arithmetic_practice"
          component={Arithmetic_Practice}
        />
        <Route
          exact
          path="/arithmetic_home"
          component={ArithmeticHome}
        />
        <Route
          exact
          path="/arithmetic_module"
          component={ArithmeticModule}
        />
        <Route
          exact
          path="/arithmetic_leaderboard"
          component={ArithmeticLeaderboard}
        />
        <Route
          exact
          path="/arithmetic_radar"
          component={ArithmeticRadar}
        />
        <Route
          exact
          path="/arithmetic_quiz"
          component={ArithmeticQuiz}
        />

        {/* Motion */}
        <Route
          exact
          path="/motion_practice"
          component={MotionPractice}
        />
        <Route exact path="/motion_quiz" component={MotionQuiz} />

        {/* Admin */}
        <Route
          exact
          path="/admin/admin_dashboard"
          component={AdminDashboard}
        />

        {/* Default redirect */}
        <Route exact path="/">
          <Redirect to="/login" />
        </Route>
      </IonRouterOutlet>
    </Router>
  </IonApp>
);

export default App;

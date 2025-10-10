import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Redirect, Route, HashRouter } from "react-router-dom";

/* Pages */
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

/* Dashboards */
import Dashboard_Arithmetic from "./Dashboard/Arithmetic_Sequence/Dashboard_Arithmetic";
import Dashboard_Motion from "./Dashboard/Uniform_Motion_in_Physics/Dashboard_Motion";

/* Arithmetic Sequence pages */
import Arithmetic_Practice from "./Dashboard/Arithmetic_Sequence/Arithmetic_Practice";
import ArithmeticHome from "./Dashboard/Arithmetic_Sequence/Arithmetic_Home";
import ArithmeticModule from "./Dashboard/Arithmetic_Sequence/Arithmetic_Module";
import ArithmeticLeaderboard from "./Dashboard/Arithmetic_Sequence/Arithmetic_Leaderboard";
import ArithmeticRadar from "./Dashboard/Arithmetic_Sequence/Arithmetic_Radar";
import ArithmeticQuiz from "./Dashboard/Arithmetic_Sequence/arithmetic_quiz";

/* Motion pages */
import MotionQuiz from "./Dashboard/Uniform_Motion_in_Physics/motion_quiz";
import MotionPractice from "./Dashboard/Uniform_Motion_in_Physics/Motion_Practice";

/* Admin */
import AdminDashboard from "./admin/admin_dashboard";

/* Ionic Core CSS */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Dark mode */
import "@ionic/react/css/palettes/dark.system.css";

/* Tailwind + Global */
import "./global.css";
import "./theme/variables.css";

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    {/* ✅ Use HashRouter to fix Vercel white screen issue */}
    <HashRouter>
      <IonReactRouter>
        <IonRouterOutlet>
          {/* 🔹 Auth Pages */}
          <Route exact path="/login" component={Login} />
          <Route exact path="/register" component={Register} />

          {/* 🔹 Home */}
          <Route exact path="/home" component={Home} />

          {/* 🔹 Dashboards */}
          <Route exact path="/dashboard_arithmetic" component={Dashboard_Arithmetic} />
          <Route exact path="/dashboard_motion" component={Dashboard_Motion} />

          {/* 🔹 Arithmetic Practice & Subpages */}
          <Route exact path="/arithmetic_practice" component={Arithmetic_Practice} />
          <Route exact path="/arithmetic_home" component={ArithmeticHome} />
          <Route exact path="/arithmetic_module" component={ArithmeticModule} />
          <Route exact path="/arithmetic_leaderboard" component={ArithmeticLeaderboard} />
          <Route exact path="/arithmetic_radar" component={ArithmeticRadar} />
          <Route exact path="/arithmetic_quiz" component={ArithmeticQuiz} />

          {/* 🔹 Motion Practice & Quiz */}
          <Route exact path="/motion_practice" component={MotionPractice} />
          <Route exact path="/motion_quiz" component={MotionQuiz} />

          {/* 🔹 Admin Dashboard */}
          <Route exact path="/admin_dashboard" component={AdminDashboard} />

          {/* 🔹 Default Redirect */}
          <Route exact path="/">
            <Redirect to="/login" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </HashRouter>
  </IonApp>
);

export default App;

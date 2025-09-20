
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Redirect, Route} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Dashboard_Arithmetic from "./Dashboard/Arithmetic_Sequence/Dashboard_Arithmetic";
import Dashboard_Motion from "./Dashboard/Uniform_Motion_in_Physics/Dashboard_Motion";
import Arithmetic_Practice from "./Dashboard/Arithmetic_Sequence/Arithmetic_Practice";

// ✅ Add the four components
import ArithmeticHome from "./Dashboard/Arithmetic_Sequence/Arithmetic_Home";
import ArithmeticModule from "./Dashboard/Arithmetic_Sequence/Arithmetic_Module";
import ArithmeticLeaderboard from "./Dashboard/Arithmetic_Sequence/Arithmetic_Leaderboard";
import ArithmeticRadar from "./Dashboard/Arithmetic_Sequence/Arithmetic_Radar";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Ionic Dark Mode */
import "@ionic/react/css/palettes/dark.system.css";

/* Tailwind + Global CSS */
import "./global.css";

/* Theme variables */
import "./theme/variables.css";

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter
>
      <IonRouterOutlet>
        {/* 🔹 Auth Pages */}
        <Route exact path="/education/login">
          <Login />
        </Route>
        <Route exact path="/education/register">
          <Register />
        </Route>

        {/* 🔹 Home */}
        <Route exact path="/education/home">
          <Home />
        </Route>

        {/* 🔹 Dashboards */}
        <Route exact path="/education/dashboard_arithmetic">
          <Dashboard_Arithmetic />
        </Route>
        <Route exact path="/education/dashboard_motion">
          <Dashboard_Motion />
        </Route>

        {/* 🔹 Arithmetic Practice (standalone route) */}
        <Route exact path="/education/arithmetic_practice">
          <Arithmetic_Practice />
        </Route>

        {/* 🔹 Arithmetic Sequence sub-pages (direct routes) */}
        <Route exact path="/education/arithmetic_home">
          <ArithmeticHome />
        </Route>
        <Route exact path="/education/arithmetic_module">
          <ArithmeticModule />
        </Route>
        <Route exact path="/education/arithmetic_leaderboard">
          <ArithmeticLeaderboard />
        </Route>
        <Route exact path="/education/arithmetic_radar">
          <ArithmeticRadar />
        </Route>

        {/* 🔹 Default redirect */}
        <Route exact path="/education/">
          <Redirect to="/education/login" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;

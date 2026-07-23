import { useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import CreatePollPage from "./pages/CreatePollPage";
import VotePage from "./pages/VotePage";
import PollCreatedPage from "./pages/PollCreatedPage";
import ResultsPage from "./pages/ResultPage";
import {lazy,Suspense } from "react";


const DashboardPage = lazy(()=>import("./pages/DashboardPage"));

const router = createBrowserRouter([
    {
      path: "/",element: <CreatePollPage />
    },
    {
      path: "/poll/:id",
      element: <VotePage />
    },{
      path: "/poll-created/:id",
      element: <PollCreatedPage />
    },{
      path:"/vote/:id",
      element:<VotePage />
    },{
      path:"/results/:id",
      element:<ResultsPage />
    },{
      path:"/dashboard",
      element:<DashboardPage />
    }

  ]);
function App() {
  

  return(
    <Suspense fallback={<div>Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );

  
}

export default App;
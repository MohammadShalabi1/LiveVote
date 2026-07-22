import { useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import CreatePollPage from "./pages/CreatePollPage";
import VotePage from "./pages/VotePage";
const router = createBrowserRouter([
    {
      path: "/",element: <CreatePollPage />
    },
    {
      path: "/poll/:id",
      element: <VotePage />
    }
  ]);
function App() {
  

  return(
    <RouterProvider router={router} />
  );

  
}

export default App;
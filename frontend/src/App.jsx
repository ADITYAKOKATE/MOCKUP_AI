import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import { AuthProvider } from "./context/AuthContext";

import { Toaster } from 'react-hot-toast';

function App() {

  return (
    <BrowserRouter>
        <AuthProvider>
            <Toaster position="top-center" reverseOrder={false} />
            <AppRoutes />
        </AuthProvider>
    </BrowserRouter>
  )
}

export default App

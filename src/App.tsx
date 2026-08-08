import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/layout/AdminLayout";
import { LoginPage } from "./features/auth/LoginPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { UsersPage } from "./features/users/UsersPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { CurrencyPage } from "./features/currencies/CurrencyPage";
import { PlansPage } from "./features/paymentPlans/PlansPage";
import { FaqsPage } from "./features/faqs/FaqsPage";
import { ChatPage } from "./features/chat/ChatPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/currencies" element={<CurrencyPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/faqs" element={<FaqsPage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

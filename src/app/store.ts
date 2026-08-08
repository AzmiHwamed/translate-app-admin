import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import usersReducer from "../features/users/usersSlice";
import dashboardReducer from "../features/dashboard/dashboardSlice";
import currenciesReducer from "../features/currencies/currencySlice";
import paymentPlansReducer from "../features/paymentPlans/paymentPlanSlice";
import faqsReducer from "../features/faqs/faqSlice";
import chatReducer from "../features/chat/chatSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    dashboard: dashboardReducer,
    currencies: currenciesReducer,
    paymentPlans: paymentPlansReducer,
    faqs: faqsReducer,
    chat: chatReducer,
    // add new slices here as you build them
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

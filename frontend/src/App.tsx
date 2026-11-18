import { Routes, Route } from "react-router-dom";

import PublicLayout from "@/components/PublicLayout";
import { Toaster } from "@/components/ui/sonner";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminLogin from "@/pages/AdminLogin";
import CategoryPage from "@/pages/CategoryPage";
import Home from "@/pages/Home";
import LocationPage from "@/pages/LocationPage";
import NotFoundPage from "@/pages/NotFoundPage";
import PrintXeroxPage from "@/pages/PrintXeroxPage";
import PrintOrderPage from "@/pages/PrintOrderPage";
import DairyDrinksPage from "@/pages/DairyDrinksPage";
import MilkSubscriptionPage from "@/pages/MilkSubscriptionPage";
import MilkSkipPage from "@/pages/MilkSkipPage";
import FestivalCollectionPage from "@/pages/FestivalCollectionPage";
import SchoolKitsPage from "@/pages/SchoolKitsPage";
import ReviewsPage from "@/pages/ReviewsPage";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/c/:slug" element={<CategoryPage />} />
          <Route path="/print-xerox" element={<PrintXeroxPage />} />
          <Route path="/location" element={<LocationPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/print-order" element={<PrintOrderPage />} />
          <Route path="/school-kits" element={<SchoolKitsPage />} />
          <Route path="/dairy-drinks" element={<DairyDrinksPage />} />
          <Route path="/milk-subscription" element={<MilkSubscriptionPage />} />
          <Route path="/milk-skip" element={<MilkSkipPage />} />
          <Route path="/festival/:id" element={<FestivalCollectionPage />} />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/:section" element={<AdminDashboard />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster richColors />
    </>
  );
}

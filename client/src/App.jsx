// file: App.jsx

import { Routes, Route } from 'react-router';
import AppLayout from './components/AppLayout.jsx';
import GuestOnly from './components/GuestOnly.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Reddit clone</h1>
      <button type="button" className="btn btn-primary mt-4">
        It works
      </button>
    </div>
  );
}

/**
 * Every route sits inside AppLayout, so every page gets the NavBar.
 * GuestOnly wraps the pages a logged-in user has no reason to see.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<SignupPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

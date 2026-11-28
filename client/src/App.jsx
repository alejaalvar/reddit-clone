// file: App.jsx

import { Routes, Route } from 'react-router';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import GuestOnly from './components/GuestOnly.jsx';

function Home() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Reddit clone</h1>
      <button type="button" className="btn btn-primary mt-4">
        It works
      </button>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignupPage />} />
      </Route>
    </Routes>
  );
}

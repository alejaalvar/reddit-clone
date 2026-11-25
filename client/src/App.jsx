import { Routes, Route } from 'react-router';

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
    </Routes>
  );
}

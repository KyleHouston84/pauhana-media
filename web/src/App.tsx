import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Admin } from "./pages/Admin";
import { WLEDConfig } from "./pages/WLEDConfig";
import { EventsConfig } from "./pages/EventsConfig";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <h1>Pau Hana Lounge</h1>
          <p className="subtitle">Tiki Bar Event Controller</p>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/wled" element={<WLEDConfig />} />
          <Route path="/admin/events" element={<EventsConfig />} />
        </Routes>

        <footer className="footer">
          <p>Pau Hana Media v1.0 • TypeScript Edition</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;

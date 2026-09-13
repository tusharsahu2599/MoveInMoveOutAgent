import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import ResidentPage from "./ResidentPage";
import AdminDashboard from "./AdminDashboard";
import "./App.css";

function Navigation() {
  const location = useLocation();

  return (
    <nav className="top-nav">
      <div className="nav-inner">
        <Link
          to="/"
          className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
        >
          Resident Portal
        </Link>

        <Link
          to="/admin"
          className={`nav-link ${
            location.pathname === "/admin" ? "active" : ""
          }`}
        >
          Admin Portal
        </Link>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navigation />

      <Routes>
        <Route path="/" element={<ResidentPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

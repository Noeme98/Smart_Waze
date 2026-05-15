import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** Sends operators to the dedicated LGU dashboard sign-in route (no UI copy). */
export default function GlobalAdminShortcut() {
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!e.ctrlKey || !e.shiftKey) return;
      const k = e.key?.toLowerCase();
      if (k !== "a") return;
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      navigate("/auth/admin");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  return null;
}

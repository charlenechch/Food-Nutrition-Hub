import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollTimeout = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant", 
      });
      
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      const root = document.getElementById("root");
      if (root) root.scrollTop = 0;
    }, 0);

    // Cleanup the timeout if the user navigates away extremely fast
    return () => clearTimeout(scrollTimeout);
  }, [pathname]);

  return null;
}
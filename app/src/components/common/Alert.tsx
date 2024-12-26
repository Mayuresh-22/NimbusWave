import { useState, useEffect } from "react";

export default function Alert({
  type,
  message,
}: {
  type: "error" | "success" | "info";
  message: string;
}) {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    if (!hide) {
      setTimeout(() => {
        setHide(false);
      }, 5000);
    }
  }, [hide]);

  return !hide ? (
    <div
      className={`absolute
        setAlert(null) z-10 bottom-20 right-20 min-w-md p-5`}
    >
      <div
        className={`p-4 ${type == "error" ? "bg-red-900" : "bg-green-800"} rounded-lg shadow-lg`}
      >
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  ) : null;
}

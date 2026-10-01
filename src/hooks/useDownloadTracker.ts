import { useState } from "react";

export function useDownloadTracker() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownload = async (studyMaterialId: string, downloadUrl: string) => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      const res = await fetch("/api/student/track-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyMaterialId }),
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.allowed) {
        alert(data.message || "Download limit reached");
        return;
      }
      
      // Trigger the actual download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.download = "";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error(error);
      alert("Failed to process download. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return { handleDownload, isProcessing };
}

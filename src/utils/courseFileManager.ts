import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";

export interface CourseExportData {
  topic: string;
  subject: string;
  grade?: string;
  authorName?: string;
  date?: string;
  content?: string;
  fileName?: string;
  fileUrl?: string;
  etablissementName?: string;
}

/**
 * Robustly downloads any course file (Data URL, Server Upload, Firebase Storage, or External URL).
 * Uses multi-tier download strategy:
 * 1. Data URLs: Decoded to Blob and downloaded via an anchor tag.
 * 2. Local server files (/api/files/): Downloaded directly with Content-Disposition header.
 * 3. Remote URLs (Firebase Storage, Google Cloud): Attempts direct fetch-to-blob, falling back to /api/download proxy to bypass iframe/CORS restrictions.
 */
export async function downloadCourseFile(url: string, preferredName?: string): Promise<boolean> {
  if (!url) {
    throw new Error("L'URL du fichier est manquante.");
  }

  // Derive a clean file name
  let fileName = preferredName || "document_de_cours";
  if (!fileName.includes(".") && url.includes(".")) {
    const ext = url.split("?")[0].split(".").pop();
    if (ext && ext.length <= 5 && /^[a-zA-Z0-9]+$/.test(ext)) {
      fileName = `${fileName}.${ext}`;
    }
  }

  // Strategy 1: Data URL
  if (url.startsWith("data:")) {
    try {
      const parts = url.split(";base64,");
      const contentType = parts[0].split(":")[1] || "application/octet-stream";
      const byteCharacters = atob(parts[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
      return true;
    } catch (e) {
      console.warn("[downloadCourseFile] Data URL download failed, trying direct anchor:", e);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }
  }

  // Strategy 2: Local server files
  if (url.startsWith("/api/files/")) {
    const downloadUrl = `${url}?downloadName=${encodeURIComponent(fileName)}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  }

  // Strategy 3: Remote URL (Firebase Storage or External)
  try {
    // Try client-side fetch first
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error(`HTTP status ${response.status}`);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
    return true;
  } catch (clientFetchErr) {
    console.warn("[downloadCourseFile] Client-side fetch failed (CORS/network), switching to server proxy:", clientFetchErr);
    // Use server proxy endpoint which bypasses all CORS & iframe constraints
    const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(fileName)}`;
    const a = document.createElement("a");
    a.href = proxyUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  }
}

/**
 * Converts a file to base64 Data URL.
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a course file reliably:
 * 1. Posts to /api/upload (direct server storage, guaranteed to work with 50MB support).
 * 2. Attempts Firebase Storage upload as parallel/secondary storage if configured.
 * 3. Falls back to Data URL if offline.
 */
export async function uploadCourseFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; fileName: string; size: number }> {
  if (onProgress) onProgress(15);

  const dataUrl = await fileToDataURL(file);
  if (onProgress) onProgress(40);

  // Try Server upload first (fast, robust, supports all formats)
  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileData: dataUrl
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (onProgress) onProgress(100);
      return {
        url: data.url,
        fileName: file.name,
        size: file.size
      };
    }
  } catch (serverErr) {
    console.warn("[uploadCourseFile] Server upload endpoint unavailable, trying Firebase Storage fallback:", serverErr);
  }

  // Firebase Storage fallback
  try {
    const { uploadBytesResumable } = await import("firebase/storage");
    const fileRef = ref(storage, `courses/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    const downloadUrl = await new Promise<string>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 50);
          if (onProgress) onProgress(40 + progress);
        },
        (err) => reject(err),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });

    if (onProgress) onProgress(100);
    return {
      url: downloadUrl,
      fileName: file.name,
      size: file.size
    };
  } catch (firebaseErr) {
    console.warn("[uploadCourseFile] Firebase storage failed, using resilient Data URL:", firebaseErr);
  }

  // Ultimate fallback: Data URL
  if (onProgress) onProgress(100);
  return {
    url: dataUrl,
    fileName: file.name,
    size: file.size
  };
}

/**
 * Generates and downloads a complete, professional PDF lesson sheet for a course.
 */
export async function exportCourseToPdf(course: CourseExportData): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo
    const darkGray: [number, number, number] = [31, 41, 55];
    const lightGray: [number, number, number] = [107, 114, 128];

    // Header Banner
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 26, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text((course.etablissementName || "ÉTABLISSEMENT SCOLAIRE").toUpperCase(), 14, 11);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("FICHE PÉDAGOGIQUE & SUPPORT DE COURS", 14, 18);

    const exportDateStr = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
    doc.text(`Document généré le ${exportDateStr}`, 196, 18, { align: "right" });

    // Course Title
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    const titleLines = doc.splitTextToSize(course.topic || "Support de cours", 182);
    doc.text(titleLines, 14, 38);

    const yAfterTitle = 38 + titleLines.length * 7;

    // Meta Information Table
    autoTable(doc, {
      startY: yAfterTitle,
      margin: { left: 14, right: 14 },
      theme: "plain",
      styles: {
        fontSize: 9,
        cellPadding: 2.5
      },
      columnStyles: {
        0: { fontStyle: "bold", textColor: primaryColor, cellWidth: 35 },
        1: { textColor: darkGray, cellWidth: 56 },
        2: { fontStyle: "bold", textColor: primaryColor, cellWidth: 35 },
        3: { textColor: darkGray, cellWidth: 56 }
      },
      body: [
        [
          "Matière :",
          course.subject || "Non spécifiée",
          "Niveau / Classe :",
          course.grade || "Toutes classes"
        ],
        [
          "Enseignant :",
          course.authorName || "Équipe pédagogique",
          "Date de publication :",
          course.date || exportDateStr
        ]
      ]
    });

    let currentY = (doc as any).lastAutoTable.finalY + 8;

    // Document joint notice if present
    if (course.fileName) {
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(14, currentY, 182, 12, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Document joint au cours :", 18, currentY + 7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text(course.fileName, 68, currentY + 7.5);
      currentY += 18;
    }

    // Divider Line
    doc.setDrawColor(229, 231, 235);
    doc.line(14, currentY, 196, currentY);
    currentY += 8;

    // Course Content Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("CONTENU ET INSTRUCTIONS DU COURS", 14, currentY);
    currentY += 6;

    // Course Content Body
    const content = course.content?.trim() || "Consultez le document joint pour le contenu complet de ce cours.";
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

    const contentLines = doc.splitTextToSize(content, 182);
    
    // Check pagination
    for (let i = 0; i < contentLines.length; i++) {
      if (currentY > 275) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(contentLines[i], 14, currentY);
      currentY += 5.5;
    }

    // Footer on all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(
        `Page ${p} sur ${pageCount} - ${course.topic || "Cours"} - ${course.subject || ""}`,
        14,
        290
      );
      doc.text("Plateforme Scolaire Intégrée", 196, 290, { align: "right" });
    }

    const safeFileName = `${(course.topic || "cours").replace(/[^a-zA-Z0-9_-]/g, "_")}_fiche.pdf`;
    doc.save(safeFileName);
    return true;
  } catch (err) {
    console.error("[exportCourseToPdf] Error generating PDF:", err);
    throw err;
  }
}

/**
 * Returns user-friendly format icon name and badge color.
 */
export function getFileTypeBadge(fileName?: string): { label: string; bg: string; text: string } {
  if (!fileName) return { label: "DOC", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-300" };
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (ext === "pdf") {
    return { label: "PDF", bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-600 dark:text-red-400" };
  }
  if (["doc", "docx", "odt", "rtf"].includes(ext)) {
    return { label: "WORD", bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400" };
  }
  if (["ppt", "pptx", "odp"].includes(ext)) {
    return { label: "PPT", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400" };
  }
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) {
    return { label: "EXCEL", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400" };
  }
  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) {
    return { label: "IMAGE", bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600 dark:text-purple-400" };
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return { label: "ARCHIVE", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300" };
  }
  return { label: ext.toUpperCase() || "FICHIER", bg: "bg-indigo-50 dark:bg-indigo-950/30", text: "text-indigo-600 dark:text-indigo-400" };
}

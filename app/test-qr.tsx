"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestQR() {
  const [result, setResult] = useState<string>("");

  const testPDFJS = async () => {
    try {
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;

      setResult("PDF.js cargado: " + pdfjsLib.version);

      // Probar cargar un PDF de ejemplo
      const testPdfUrl =
        "https://medicar.sis-colombia.com/pharmaser/mutualser/el_admin/comunes/plano_despacho_reimprimir_pdf.php?todos=1&id_formula=3394535&id_punto=14";

      const loadingTask = pdfjsLib.getDocument({
        url: testPdfUrl,
        withCredentials: false,
      });

      const pdf = await loadingTask.promise;
      setResult((prev) => prev + `\nPDF cargado: ${pdf.numPages} páginas`);

      const page = await pdf.getPage(1);
      const ops = await page.getOperatorList();

      setResult(
        (prev) => prev + `\nOperaciones en página 1: ${ops.fnArray.length}`
      );

      // Contar imágenes
      let imageCount = 0;
      for (let i = 0; i < ops.fnArray.length; i++) {
        if (
          ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject ||
          ops.fnArray[i] === pdfjsLib.OPS.paintInlineImageXObject
        ) {
          imageCount++;
        }
      }

      setResult((prev) => prev + `\nImágenes encontradas: ${imageCount}`);
    } catch (error: any) {
      setResult("Error: " + error.message);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Test PDF.js</h1>
      <Button onClick={testPDFJS}>Probar PDF.js</Button>
      <pre className="mt-4 p-4 bg-gray-100 rounded">{result}</pre>
    </div>
  );
}

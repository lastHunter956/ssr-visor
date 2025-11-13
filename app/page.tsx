"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  AlertCircle,
  ExternalLink,
  FileText,
  FileImage,
} from "lucide-react";

// Extensiones de imagen a probar (ordenadas por probabilidad de uso)
const IMAGE_EXTENSIONS = [
  "jpeg",
  "jpg",
  "png",
  "webp",
  "jfif",
  "bmp",
  "gif",
  "tiff",
  "tif",
  "svg",
  "ico",
  "heic",
  "heif",
  "avif",
  "JPG",
  "JPEG",
  "PNG",
  "WEBP",
  "JFIF",
  "BMP",
  "GIF",
  "TIFF",
  "TIF",
];

export default function VisualizadorPage() {
  const [inputValue, setInputValue] = useState("");
  const [ssc, setSsc] = useState("");
  const [guia, setGuia] = useState("");
  const [error, setError] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [imageError, setImageError] = useState(false);
  const [imageExtensionIndex, setImageExtensionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Función para buscar y dividir el input
  const handleSearch = () => {
    // Limpiar visualizadores previos
    setSsc("");
    setGuia("");
    setError("");
    setImageError(false);
    setShowResults(false);
    setCurrentImageUrl("");
    setImageExtensionIndex(0);

    const trimmedInput = inputValue.trim();

    const normalizedInput = trimmedInput.replace(/\s+/g, " ");

    // Try to format the input if it's continuous
    const formattedInput = formatGuiaIfNeeded(normalizedInput);

    // Check if format was applied (contains dashes now)
    if (formattedInput.includes("-") && !normalizedInput.includes(" ")) {
      // This is a continuous format that was converted
      // We need SSC separately, so show error
      setError(
        "Formato incorrecto. Por favor ingresa: SSC GUIA (separados por espacio). Ejemplo: 3394535 335-17-20-CC-3589"
      );
      return;
    }

    if (!normalizedInput.includes(" ")) {
      setError(
        "Formato incorrecto. Por favor ingresa el texto con el formato: SSC GUIA (separados por espacio)"
      );
      return;
    }

    const parts = normalizedInput.split(" ");
    if (parts.length !== 2) {
      setError(
        "Formato incorrecto. Debes ingresar exactamente dos valores separados por un espacio"
      );
      return;
    }

    let [sscValue, guiaValue] = parts;

    guiaValue = formatGuiaIfNeeded(guiaValue);

    setSsc(sscValue);
    setGuia(guiaValue);
    setShowResults(true);

    // Intentar cargar la primera extensión de imagen
    tryLoadImage(guiaValue, 0);
  };

  // Función para intentar cargar imagen con diferentes extensiones
  const tryLoadImage = (guiaValue: string, extensionIndex: number) => {
    if (extensionIndex >= IMAGE_EXTENSIONS.length) {
      setImageError(true);
      return;
    }

    const extension = IMAGE_EXTENSIONS[extensionIndex];
    const imageUrl = `https://us-east-1.linodeobjects.com/codigoverde01-bucket/adjuntos/grupotuga/xx/CUMPLIDOS/${guiaValue}/DC_${guiaValue}.${extension}`;
    setCurrentImageUrl(imageUrl);
    setImageExtensionIndex(extensionIndex);
  };

  // Manejar error de carga de imagen
  const handleImageError = () => {
    // Intentar con la siguiente extensión
    const nextIndex = imageExtensionIndex + 1;
    if (nextIndex < IMAGE_EXTENSIONS.length) {
      tryLoadImage(guia, nextIndex);
    } else {
      setImageError(true);
    }
  };

  // Función para formatear la guía si es continua
  const formatGuiaIfNeeded = (input: string): string => {
    // Check if input matches pattern: digits + letters + digits (e.g., "3351720CC3589")
    const match = input.match(/^(\d{3})(\d{2})(\d{2})([A-Z]+)(\d+)$/i);
    if (match) {
      // Format as: 335-17-20-CC-3589
      return `${match[1]}-${match[2]}-${match[3]}-${match[4].toUpperCase()}-${
        match[5]
      }`;
    }
    return input;
  };

  // Generar URL del PDF
  const getPdfUrl = (sscValue: string) => {
    return `https://medicar.sis-colombia.com/pharmaser/mutualser/el_admin/comunes/plano_despacho_reimprimir_pdf.php?todos=1&id_formula=${sscValue}&id_punto=14`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
                <FileText className="size-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  Sistema de Visualización
                </h1>
                <p className="text-sm text-muted-foreground">
                  SSC y Guías de Despacho
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <div className="mb-10">
          <div className="mb-6 max-w-2xl">
            <h2 className="text-2xl font-semibold text-foreground">
              Buscar Documento
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Ingresa el código SSC y el número de guía separados por un espacio
              o tabulación. El sistema buscará automáticamente los documentos
              asociados.
            </p>
          </div>

          <Card className="max-w-3xl border-border bg-card shadow-sm">
            <div className="p-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Ej: 3394535 335-17-20-CC-3589"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="h-11 pl-10 text-base"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  size="lg"
                  className="h-11 sm:w-auto sm:px-8"
                >
                  Buscar
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Card>
        </div>

        {showResults && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* PDF Card */}
            <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
              <div className="border-b border-border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-primary/10">
                    <FileText className="size-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Documento SSC
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                      {ssc}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col items-center justify-center gap-4 rounded-lg bg-muted/50 py-12">
                  <div className="flex size-16 items-center justify-center rounded-full bg-background shadow-sm">
                    <FileText className="size-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-foreground">
                      Documento PDF
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Visualizar en navegador
                    </p>
                  </div>
                  <Button
                    onClick={() => window.open(getPdfUrl(ssc), "_blank")}
                    size="lg"
                    className="mt-2 gap-2 shadow-sm"
                  >
                    <ExternalLink className="size-4" />
                    Abrir Documento
                  </Button>
                </div>
              </div>
            </Card>

            {/* Image Card */}
            <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
              <div className="border-b border-border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-primary/10">
                    <FileImage className="size-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Guía de Despacho
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                      {guia}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {!imageError ? (
                  <div className="overflow-hidden rounded-lg border border-border bg-muted/50">
                    <img
                      src={currentImageUrl || "/placeholder.svg"}
                      alt={`Guía ${guia}`}
                      className="w-full"
                      onError={handleImageError}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 rounded-lg bg-muted/50 py-12">
                    <div className="flex size-16 items-center justify-center rounded-full bg-background shadow-sm">
                      <AlertCircle className="size-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-foreground">
                        Imagen no disponible
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        No se encontró la imagen en ningún formato
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

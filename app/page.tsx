"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  AlertCircle,
  ExternalLink,
  FileText,
  FileImage,
  Maximize,
  ChevronLeft,
  ChevronRight,
  List,
  Trash2,
  Bookmark,
  BookmarkCheck,
  ZoomIn,
  ZoomOut,
  RotateCw,
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

// Interfaz para los registros precargados
interface PreloadedRecord {
  ssc: string;
  guia: string;
  index: number;
  marked?: boolean;
}

export default function VisualizadorPage() {
  const [inputValue, setInputValue] = useState("");
  const [ssc, setSsc] = useState("");
  const [guia, setGuia] = useState("");
  const [error, setError] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [imageError, setImageError] = useState(false);
  const [imageExtensionIndex, setImageExtensionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Estados para precarga masiva
  const [preloadedRecords, setPreloadedRecords] = useState<PreloadedRecord[]>(
    []
  );
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [showMarkedDialog, setShowMarkedDialog] = useState(false);

  // Estados para el visor de imagen con zoom
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageZoom, setImageZoom] = useState(100);
  const [imageRotation, setImageRotation] = useState(0);

  // Estados para pan/arrastre de imagen
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

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

    // Detectar si es entrada masiva (tiene múltiples líneas)
    if (trimmedInput.includes("\n")) {
      const records = parseBulkInput(trimmedInput);

      if (records.length === 0) {
        setError(
          "No se encontraron registros válidos en el formato correcto. Use: SSC [TAB] GUIA por línea"
        );
        return;
      }

      // Activar modo bulk y cargar el primer registro
      setPreloadedRecords(records);
      setIsBulkMode(true);
      setCurrentRecordIndex(0);
      navigateToRecord(0);
      return;
    }

    // Limpiar cache si no es bulk mode
    if (isBulkMode) {
      setPreloadedRecords([]);
      setIsBulkMode(false);
      setCurrentRecordIndex(0);
    }

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

  // Función para parsear entrada masiva
  const parseBulkInput = (input: string): PreloadedRecord[] => {
    const lines = input.split("\n").filter((line) => line.trim() !== "");
    const records: PreloadedRecord[] = [];

    lines.forEach((line, index) => {
      const parts = line.trim().split(/\t+/); // Split por uno o más tabs
      if (parts.length >= 2) {
        const sscValue = parts[0].trim();
        const guiaValue = formatGuiaIfNeeded(parts[1].trim());

        // Validación básica
        if (sscValue && guiaValue) {
          records.push({
            ssc: sscValue,
            guia: guiaValue,
            index: index,
          });
        }
      }
    });

    return records;
  };

  // Navegación entre registros precargados
  const navigateToRecord = (index: number) => {
    if (index >= 0 && index < preloadedRecords.length) {
      const record = preloadedRecords[index];
      setCurrentRecordIndex(index);
      setSsc(record.ssc);
      setGuia(record.guia);
      setInputValue(`${record.ssc} ${record.guia}`);

      // Resetear estados de imagen
      setImageExtensionIndex(0);
      setImageError(false);
      setShowResults(true);

      // Construir URL de imagen
      const baseUrl = `https://us-east-1.linodeobjects.com/codigoverde01-bucket/adjuntos/grupotuga/xx/CUMPLIDOS/`;
      const imageUrl = `${baseUrl}${record.guia}/DC_${record.guia}.${IMAGE_EXTENSIONS[0]}`;
      setCurrentImageUrl(imageUrl);
    }
  };

  const navigateNext = () => {
    if (currentRecordIndex < preloadedRecords.length - 1) {
      navigateToRecord(currentRecordIndex + 1);
    }
  };

  const navigatePrevious = () => {
    if (currentRecordIndex > 0) {
      navigateToRecord(currentRecordIndex - 1);
    }
  };

  const clearCache = () => {
    setPreloadedRecords([]);
    setCurrentRecordIndex(0);
    setIsBulkMode(false);
    setInputValue("");
    setSsc("");
    setGuia("");
    setShowResults(false);
    setError("");
  };

  // Funciones para marcar registros
  const toggleMarkCurrentRecord = () => {
    setPreloadedRecords((prev) =>
      prev.map((record, idx) =>
        idx === currentRecordIndex
          ? { ...record, marked: !record.marked }
          : record
      )
    );
  };

  const toggleMarkRecord = (index: number) => {
    setPreloadedRecords((prev) =>
      prev.map((record, idx) =>
        idx === index ? { ...record, marked: !record.marked } : record
      )
    );
  };

  const getMarkedCount = () => {
    return preloadedRecords.filter((r) => r.marked).length;
  };

  // Funciones para el visor de imagen
  const handleZoomIn = () => {
    setImageZoom((prev) => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setImageZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setImageRotation((prev) => (prev + 90) % 360);
  };

  const resetImageViewer = () => {
    setImageZoom(100);
    setImageRotation(0);
    setPanOffset({ x: 0, y: 0 });
  };

  const openImageViewer = () => {
    resetImageViewer();
    setShowImageViewer(true);
  };

  // Funciones para pan/arrastre de imagen
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
  };

  // Función para scroll con rueda del ratón
  const handleWheel = (e: React.WheelEvent) => {
    if (!isPanning) {
      // Desplazar la imagen usando el pan offset
      setPanOffset((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
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
              Ingresa el código SSC y el número de guía separados por un
              espacio. Para búsqueda masiva, pega múltiples líneas con formato:
              SSC [TAB] GUIA. El sistema precargará todos los registros y podrás
              navegar entre ellos.
            </p>
          </div>

          <Card className="max-w-3xl border-border bg-card shadow-sm">
            <div className="p-6">
              <div className="flex flex-col gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 size-4 text-muted-foreground z-10" />
                  <Textarea
                    placeholder="Ej: 3394535 335-17-20-CC-3589&#10;&#10;O pega múltiples líneas:&#10;SSC [TAB] GUIA&#10;SSC [TAB] GUIA&#10;..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !inputValue.includes("\n")
                      ) {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    className="min-h-[100px] max-h-[300px] pl-10 text-base resize-none overflow-y-auto"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSearch}
                    size="lg"
                    className="flex-1 h-11"
                  >
                    <Search className="size-4 mr-2" />
                    Buscar
                  </Button>
                  {isBulkMode && (
                    <Button
                      onClick={clearCache}
                      size="lg"
                      variant="outline"
                      className="h-11"
                    >
                      <Trash2 className="size-4 mr-2" />
                      Limpiar Cache
                    </Button>
                  )}
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Barra de navegación para modo bulk */}
              {isBulkMode && preloadedRecords.length > 0 && (
                <div className="mt-4 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-md border border-border/50">
                        <List className="size-3.5 text-primary" />
                        <span className="text-xs font-semibold text-foreground">
                          {currentRecordIndex + 1}/{preloadedRecords.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background/60 backdrop-blur-sm rounded-md border border-border/40">
                          <span className="text-[10px] uppercase font-medium text-muted-foreground/70">
                            SSC
                          </span>
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {ssc}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background/60 backdrop-blur-sm rounded-md border border-border/40">
                          <span className="text-[10px] uppercase font-medium text-muted-foreground/70">
                            Guía
                          </span>
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {guia}
                          </span>
                        </div>
                      </div>
                      {getMarkedCount() > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/15 rounded-md">
                          <BookmarkCheck className="size-3.5 text-primary" />
                          <span className="text-xs font-medium text-primary">
                            {getMarkedCount()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        onClick={toggleMarkCurrentRecord}
                        size="sm"
                        variant={
                          preloadedRecords[currentRecordIndex]?.marked
                            ? "default"
                            : "ghost"
                        }
                        className="h-8 px-3"
                      >
                        {preloadedRecords[currentRecordIndex]?.marked ? (
                          <BookmarkCheck className="size-3.5" />
                        ) : (
                          <Bookmark className="size-3.5" />
                        )}
                      </Button>

                      <Dialog
                        open={showMarkedDialog}
                        onOpenChange={setShowMarkedDialog}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-3"
                          >
                            <List className="size-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                          <DialogHeader>
                            <DialogTitle className="text-lg">
                              Registros Precargados
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                              {preloadedRecords.length} registros •{" "}
                              {getMarkedCount()} marcados
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                            <div className="space-y-1.5">
                              {preloadedRecords.map((record, idx) => (
                                <div
                                  key={idx}
                                  className={`group p-2.5 rounded-md border transition-all cursor-pointer ${
                                    idx === currentRecordIndex
                                      ? "bg-primary/10 border-primary/50 shadow-sm"
                                      : "bg-card/50 border-border/50 hover:border-primary/30 hover:bg-card"
                                  }`}
                                  onClick={() => {
                                    navigateToRecord(idx);
                                    setShowMarkedDialog(false);
                                  }}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-xs font-mono text-muted-foreground w-8 flex-shrink-0">
                                      #{idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-4 gap-y-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] uppercase font-medium text-muted-foreground/70">
                                          SSC
                                        </span>
                                        <span className="font-mono text-xs font-medium truncate">
                                          {record.ssc}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] uppercase font-medium text-muted-foreground/70">
                                          Guía
                                        </span>
                                        <span className="font-mono text-xs truncate">
                                          {record.guia}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      {idx === currentRecordIndex && (
                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground rounded uppercase tracking-wide">
                                          Actual
                                        </span>
                                      )}
                                      <Button
                                        size="sm"
                                        variant={
                                          record.marked ? "default" : "ghost"
                                        }
                                        className="h-7 w-7 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleMarkRecord(idx);
                                        }}
                                      >
                                        {record.marked ? (
                                          <BookmarkCheck className="size-3.5" />
                                        ) : (
                                          <Bookmark className="size-3.5 opacity-50 group-hover:opacity-100" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <div className="h-5 w-px bg-border/50 mx-0.5" />

                      <Button
                        onClick={navigatePrevious}
                        disabled={currentRecordIndex === 0}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        onClick={navigateNext}
                        disabled={
                          currentRecordIndex === preloadedRecords.length - 1
                        }
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {showResults && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* PDF Card */}
            <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
              <div className="border-b border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
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
                  <Button
                    onClick={() => window.open(getPdfUrl(ssc), "_blank")}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Maximize className="size-4" />
                    Pantalla completa
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="overflow-hidden rounded-lg border border-border bg-muted/50">
                  <iframe
                    src={getPdfUrl(ssc)}
                    className="h-[600px] w-full"
                    title={`PDF SSC ${ssc}`}
                  />
                </div>
              </div>
            </Card>

            {/* Image Card */}
            <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
              <div className="border-b border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
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
                  {!imageError && (
                    <Button
                      onClick={openImageViewer}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <Maximize className="size-4" />
                      Pantalla completa
                    </Button>
                  )}
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

        {/* Barra de navegación inferior (duplicada) */}
        {isBulkMode && preloadedRecords.length > 0 && showResults && (
          <div className="mt-4 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-md border border-border/50">
                  <List className="size-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    {currentRecordIndex + 1}/{preloadedRecords.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background/60 backdrop-blur-sm rounded-md border border-border/40">
                    <span className="text-[10px] uppercase font-medium text-muted-foreground/70">
                      SSC
                    </span>
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {ssc}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background/60 backdrop-blur-sm rounded-md border border-border/40">
                    <span className="text-[10px] uppercase font-medium text-muted-foreground/70">
                      Guía
                    </span>
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {guia}
                    </span>
                  </div>
                </div>
                {getMarkedCount() > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/15 rounded-md">
                    <BookmarkCheck className="size-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">
                      {getMarkedCount()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  onClick={toggleMarkCurrentRecord}
                  size="sm"
                  variant={
                    preloadedRecords[currentRecordIndex]?.marked
                      ? "default"
                      : "ghost"
                  }
                  className="h-8 px-3"
                >
                  {preloadedRecords[currentRecordIndex]?.marked ? (
                    <BookmarkCheck className="size-3.5" />
                  ) : (
                    <Bookmark className="size-3.5" />
                  )}
                </Button>

                <Dialog
                  open={showMarkedDialog}
                  onOpenChange={setShowMarkedDialog}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 px-3">
                      <List className="size-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle className="text-lg">
                        Registros Precargados
                      </DialogTitle>
                      <DialogDescription className="text-sm">
                        {preloadedRecords.length} registros • {getMarkedCount()}{" "}
                        marcados
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                      <div className="space-y-1.5">
                        {preloadedRecords.map((record, idx) => (
                          <div
                            key={idx}
                            className={`group p-2.5 rounded-md border transition-all cursor-pointer ${
                              idx === currentRecordIndex
                                ? "bg-primary/10 border-primary/50 shadow-sm"
                                : "bg-card/50 border-border/50 hover:border-primary/30 hover:bg-card"
                            }`}
                            onClick={() => {
                              navigateToRecord(idx);
                              setShowMarkedDialog(false);
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs font-mono text-muted-foreground w-8 flex-shrink-0">
                                #{idx + 1}
                              </span>
                              <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-4 gap-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] uppercase font-medium text-muted-foreground/70">
                                    SSC
                                  </span>
                                  <span className="font-mono text-xs font-medium truncate">
                                    {record.ssc}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] uppercase font-medium text-muted-foreground/70">
                                    Guía
                                  </span>
                                  <span className="font-mono text-xs truncate">
                                    {record.guia}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {idx === currentRecordIndex && (
                                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground rounded uppercase tracking-wide">
                                    Actual
                                  </span>
                                )}
                                <Button
                                  size="sm"
                                  variant={record.marked ? "default" : "ghost"}
                                  className="h-7 w-7 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMarkRecord(idx);
                                  }}
                                >
                                  {record.marked ? (
                                    <BookmarkCheck className="size-3.5" />
                                  ) : (
                                    <Bookmark className="size-3.5 opacity-50 group-hover:opacity-100" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="h-5 w-px bg-border/50 mx-0.5" />

                <Button
                  onClick={navigatePrevious}
                  disabled={currentRecordIndex === 0}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  onClick={navigateNext}
                  disabled={currentRecordIndex === preloadedRecords.length - 1}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Visor de imagen con zoom */}
        <Dialog open={showImageViewer} onOpenChange={setShowImageViewer}>
          <DialogContent
            className="p-0 overflow-hidden [&>button]:top-2 [&>button]:right-2 [&>button]:z-50 [&>button]:bg-background/80 [&>button]:backdrop-blur-sm [&>button]:shadow-md"
            style={{
              maxWidth: "calc(100vw - 50px)",
              width: "calc(100vw - 50px)",
              maxHeight: "calc(100vh - 50px)",
              height: "calc(100vh - 50px)",
            }}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>
                Visor de Imagen - Guía de Despacho {guia}
              </DialogTitle>
              <DialogDescription>
                Visualizador de imagen con zoom y rotación para la guía {guia}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <FileImage className="size-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-sm">Guía de Despacho</h3>
                    <p className="font-mono text-xs text-muted-foreground">
                      {guia}
                    </p>
                  </div>
                  <div className="ml-4 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md">
                    <p className="text-[10px] font-medium text-primary">
                      💡 Doble click: zoom • Arrastrar: mover imagen
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleZoomOut}
                    size="sm"
                    variant="outline"
                    disabled={imageZoom <= 50}
                    className="hover:bg-primary/10 disabled:opacity-50"
                  >
                    <ZoomOut className="size-4" />
                  </Button>
                  <div className="px-3 py-1.5 bg-background border border-border rounded-md">
                    <span className="text-xs font-semibold">{imageZoom}%</span>
                  </div>
                  <Button
                    onClick={handleZoomIn}
                    size="sm"
                    variant="outline"
                    disabled={imageZoom >= 300}
                    className="hover:bg-primary/10 disabled:opacity-50"
                  >
                    <ZoomIn className="size-4" />
                  </Button>
                  <div className="h-6 w-px bg-border mx-1" />
                  <Button
                    onClick={handleRotate}
                    size="sm"
                    variant="outline"
                    className="hover:bg-primary/10"
                  >
                    <RotateCw className="size-4" />
                  </Button>
                </div>
              </div>
              <div
                className="flex-1 overflow-hidden bg-muted/20 flex items-center justify-center p-4 relative"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onWheel={handleWheel}
                style={{
                  cursor: isPanning ? "grabbing" : "grab",
                }}
              >
                <div
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                    transition: isPanning ? "none" : "transform 0.2s ease-out",
                  }}
                >
                  <img
                    src={currentImageUrl || "/placeholder.svg"}
                    alt={`Guía ${guia}`}
                    onDoubleClick={() => {
                      // Alternar entre 100% y 200%
                      if (imageZoom === 100) {
                        setImageZoom(200);
                      } else {
                        setImageZoom(100);
                        setPanOffset({ x: 0, y: 0 });
                      }
                    }}
                    style={{
                      transform: `scale(${
                        imageZoom / 100
                      }) rotate(${imageRotation}deg)`,
                      transition: "transform 0.2s ease-out",
                      maxWidth: imageZoom > 100 ? "none" : "100%",
                      maxHeight: imageZoom > 100 ? "none" : "100%",
                      width: imageZoom > 100 ? "auto" : "100%",
                      height: imageZoom > 100 ? "auto" : "100%",
                      objectFit: "contain",
                    }}
                    className="select-none"
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

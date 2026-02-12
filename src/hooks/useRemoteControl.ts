import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { type AnnotationDTO } from "../lib/tauri/commands";
import { dtoToAnnotation } from "../lib/annotations/converters";
import { usePDFStore } from "../stores/pdf.store";

interface PageChangedPayload {
  page: number;
  totalPages: number;
}

interface ZoomChangedPayload {
  zoom: number;
}

interface PresenterChangedPayload {
  active: boolean;
}

/**
 * Hook to handle remote control events (from WebSocket/Stream Deck)
 */
export const useRemoteControl = (
  setPresenterMode: (active: boolean) => void
) => {
  const { setCurrentPage, setZoom } = usePDFStore();

  useEffect(() => {
    let unlisten: (() => void)[] = [];

    const setupListeners = async () => {
      // Listen for page changes (e.g. from Stream Deck "Next Page")
      const unlistenPage = await listen<PageChangedPayload>(
        "page-changed",
        (event) => {
          console.log("Remote page change:", event.payload);
          setCurrentPage(event.payload.page);
        }
      );
      unlisten.push(unlistenPage);

      // Listen for zoom changes
      const unlistenZoom = await listen<ZoomChangedPayload>(
        "zoom-changed",
        (event) => {
          console.log("Remote zoom change:", event.payload);
          setZoom(event.payload.zoom);
        }
      );
      unlisten.push(unlistenZoom);

      // Listen for presenter mode toggles
      const unlistenPresenter = await listen<PresenterChangedPayload>(
        "presenter-changed",
        (event) => {
          console.log("Remote presenter change:", event.payload);
          setPresenterMode(event.payload.active);
        }
      );
      unlisten.push(unlistenPresenter);

      // Listen for annotation additions (from remote clients)
      // Listen for annotation additions (from remote clients)
      const unlistenAnnotation = await listen<{
        page: number;
        annotation: AnnotationDTO;
      }>("annotation-added", (event) => {
        console.log("Remote annotation added:", event.payload);
        usePDFStore
          .getState()
          .addAnnotation(dtoToAnnotation(event.payload.annotation));
      });
      unlisten.push(unlistenAnnotation);

      // Listen for annotation clearing
      const unlistenClear = await listen("annotations-cleared", () => {
        console.log("Remote annotations cleared");
        usePDFStore.getState().clearAnnotations();
      });
      unlisten.push(unlistenClear);
    };

    setupListeners();

    return () => {
      unlisten.forEach((fn) => fn());
    };
  }, [setCurrentPage, setZoom, setPresenterMode]);
};

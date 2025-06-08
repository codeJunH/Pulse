import { ProjectModel } from '@noodl-models/projectmodel';
import { useEffect } from 'react';
import { CanvasView } from '../../../VisualCanvas/CanvasView';
import { ipcRenderer } from 'electron';

export function useCaptureThumbnails(canvasView: CanvasView, viewerDetached: boolean) {
  useEffect(() => {
    // Capture thumbnail immediately if project doesn't have one
    const captureIfNeeded = async () => {
      const currentThumbnail = ProjectModel.instance.getThumbnailURI();
      if (!currentThumbnail || currentThumbnail.trim() === '') {
        console.log('No thumbnail found, capturing immediately...');
        if (viewerDetached) {
          ipcRenderer.send('viewer-capture-thumb');
          ipcRenderer.once('viewer-capture-thumb-reply', (event, url) => {
            ProjectModel.instance.setThumbnailFromDataURI(url);
          });
        } else {
          const thumb = await canvasView?.captureThumbnail();
          if (thumb) {
            ProjectModel.instance.setThumbnailFromDataURI(thumb.toDataURL());
          }
        }
      }
    };

    // Try to capture immediately
    setTimeout(captureIfNeeded, 2000); // Wait 2 seconds for canvas to be ready

    // Start capture interval for viewer thumbs
    const timer = setInterval(async () => {
      if (viewerDetached) {
        ipcRenderer.send('viewer-capture-thumb');
        ipcRenderer.once('viewer-capture-thumb-reply', (event, url) => {
          ProjectModel.instance.setThumbnailFromDataURI(url);
        });
      } else {
        const thumb = await canvasView?.captureThumbnail();
        if (thumb) {
          ProjectModel.instance.setThumbnailFromDataURI(thumb.toDataURL());
        }
      }
    }, 20 * 1000); // Every 20 secs

    return () => {
      clearInterval(timer);
    };
  }, [canvasView, viewerDetached]);
}

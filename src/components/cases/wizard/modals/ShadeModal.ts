export interface ShadeData {
  occlusal: string;
  middle: string;
  gingival: string;
}

export interface ShadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shadeData: ShadeData) => void;
  initialShade?: ShadeData;
}

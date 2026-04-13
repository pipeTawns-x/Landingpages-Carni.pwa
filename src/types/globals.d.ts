export {};

declare global {
  interface Window {
    CarniCart?: {
      addItem: (item: {
        id: number;
        name: string;
        price: number;
        img: string;
        categoria?: string;
        tipo?: string;
        peso?: number;
        piezas?: number;
        grosor?: number;
        basePeso?: number;
      }) => void;
    };
    __carniServerProbe?: {
      active: boolean;
      found: boolean;
    };
  }
}

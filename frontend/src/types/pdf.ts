export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface TextBlock {
  text: string;
  bbox: number[];
  page: number;
}

export interface PDFResponse {
  blocks: TextBlock[];
}

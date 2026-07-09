import { hhrManifest, registerProduct } from '@iie/product-manifests';
import type { ProductManifest } from '@iie/product-manifests';

registerProduct(hhrManifest);

export { hhrManifest };
export type { ProductManifest };

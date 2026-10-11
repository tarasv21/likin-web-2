import { createGa } from '@/lib/ga';
import { createClarity } from '@/lib/clarity';

const HOSTS = ['likinagency.com', 'www.likinagency.com'];

/** Google Analytics 4 de likinagency.com: solo en el dominio real y con el consentimiento (ga.ts). */
export const ga = createGa('G-8261QVV57Y', HOSTS);

/** Microsoft Clarity de likinagency.com: solo en el dominio real y con el consentimiento (clarity.ts). */
export const clarity = createClarity('yw01dhn5vl', HOSTS);

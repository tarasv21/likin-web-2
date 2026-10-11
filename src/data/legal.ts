/**
 * Data of the legal pages (/aviso-legal, /privacidad, /cookies and the line under the form).
 * Identity data given by Taras on 2026-10-10; retention and international transfers approved by
 * Taras on 2026-10-11 (docs/LEGAL_REVIEW.md). Change the texts only with his approval, and bump
 * `policyVersion` and `updated` when they change.
 */
export const legal = {
  /** Titular del sitio y responsable del tratamiento (persona física). */
  holder: "Taras Vasyliv",
  /** Nombre comercial. */
  tradeName: "LIKIN Agency",
  /** Forma jurídica. */
  legalForm: "empresario individual (autónomo)",
  /** NIF/NIE del titular. */
  taxId: "X7222864J",
  /** Domicilio fiscal. */
  address: "C/ Víctor Balaguer, 1, 1LL, 25200 Cervera, Lleida, España",
  /** Inscripción registral: no aplica a un empresario individual. */
  registry: "",
  /** Plazos de conservación (propuesta de docs/LEGAL_REVIEW.md §3, aprobada por Taras el 2026-10-11). */
  retention: [
    "Tu solicitud: mientras la gestionamos. Si no llega a haber relación comercial, la borramos a los 24 meses desde el último contacto. Si se convierte en un encargo, la conservamos durante los plazos que exija la ley.",
    "Las copias técnicas que guardan nuestros proveedores (por ejemplo, Resend y Vercel) se conservan según los plazos de cada uno.",
    "Tu decisión sobre las cookies se guarda en tu navegador y te la volvemos a pedir a los 12 meses. Cómo llegaste a la web se guarda hasta que cierras la pestaña. Lo que reciben Meta y Google Analytics se rige por sus propias políticas (en Google Analytics, también por el plazo de conservación configurado en la cuenta).",
  ],
  /** Transferencias internacionales y su garantía, proveedor por proveedor (decisión de Taras, 2026-10-11). */
  transfers: [
    "Algunos de nuestros proveedores son de fuera del Espacio Económico Europeo o guardan datos fuera de él. En todos los casos la transferencia se basa en una decisión de adecuación de la Comisión Europea:",
    "Meta: Meta Platforms Ireland puede transferir los datos a Meta Platforms, Inc. (Estados Unidos), certificada en el Marco de Privacidad de Datos UE-EE. UU. (Data Privacy Framework).",
    "Resend (Resend, Inc., Estados Unidos): los emails se envían desde su región de Japón, país con decisión de adecuación de la UE. Los datos de la cuenta, los metadatos de los envíos y los registros se guardan en Estados Unidos; Resend está certificada en el Data Privacy Framework.",
    "Vercel (Vercel Inc., Estados Unidos): las funciones de la web se ejecutan en Fráncfort (Alemania); para lo que trate en Estados Unidos, Vercel está certificada en el Data Privacy Framework.",
    "Google (Google Workspace y Google Analytics): los datos pueden tratarse en Estados Unidos por Google LLC, certificada en el Data Privacy Framework.",
  ],
  /**
   * Aviso de «texto provisional» en las páginas legales. Taras aprobó los textos y pidió quitarlo el
   * 2026-10-11. No significa que un profesional los haya revisado.
   */
  provisional: false,
  /** Fecha de la última actualización de los textos. */
  updated: "11 de octubre de 2026",
  /** Versión de la política de privacidad que se guarda con cada solicitud (sube con cada cambio de los textos). */
  policyVersion: "likinagency-privacidad@2026-10-11.2",
};


/** «Taras Vasyliv (LIKIN Agency)». */
export const holderWithTradeName = () => `${legal.holder} (${legal.tradeName})`;

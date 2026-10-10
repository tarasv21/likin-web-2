/**
 * Data of the legal pages (/aviso-legal, /privacidad, /cookies and the line under the form).
 * Identity data given by Taras on 2026-10-10. What depends on a legal or business decision is left
 * empty on purpose — never invented — and shows as "[pendiente: …]" until it is filled in after the
 * legal review; the "provisional" notice stays until `reviewed` is true. `npm run launch:check`
 * refuses to give the go-ahead while anything is pending.
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
  /** Servicio al que apunta LEAD_WEBHOOK_URL (el que envía hoy el email con cada solicitud). Pendiente de identificar. */
  webhookService: "",
  /** Plazos de conservación de las solicitudes. Los decide el responsable con su asesor. */
  retention: "",
  /** Transferencias internacionales y su garantía, proveedor por proveedor. Se completa en la revisión jurídica. */
  transfers: "",
  /** true cuando un profesional haya revisado los textos de privacidad, cookies y aviso legal. */
  reviewed: false,
  /** Fecha de la última actualización de los textos. */
  updated: "10 de octubre de 2026",
};

export const pending = (value: string, what: string) => value.trim() || `[pendiente: ${what}]`;

/** «Taras Vasyliv (LIKIN Agency)». */
export const holderWithTradeName = () => `${legal.holder} (${legal.tradeName})`;

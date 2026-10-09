/**
 * Data of the legal pages that only Taras can give. Before publishing in production fill in the
 * empty fields; every empty field shows as "[pendiente]" on the pages, and the "provisional"
 * notice stays until `reviewed` is true (after the legal review).
 */
export const legal = {
  /** Nombre y apellidos o razón social del titular de likinagency.com. */
  holder: "",
  /** NIF del titular. */
  taxId: "",
  /** Domicilio del titular. */
  address: "",
  /** Inscripción registral (solo sociedades), p. ej. «Registro Mercantil de …, tomo …». */
  registry: "",
  /** Servicio al que apunta LEAD_WEBHOOK_URL (el que envía hoy el email con cada solicitud). */
  webhookService: "",
  /** true cuando un profesional haya revisado los textos de privacidad, cookies y aviso legal. */
  reviewed: false,
  /** Fecha de la última actualización de los textos. */
  updated: "10 de octubre de 2026",
};

export const pending = (value: string, what: string) => value.trim() || `[pendiente: ${what}]`;

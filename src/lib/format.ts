const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export function formatPence(pence: number) {
  return gbp.format(pence / 100);
}

/** 4900 -> "49.00", for the price input. */
export function penceToInput(pence: number) {
  return (pence / 100).toFixed(2);
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export function formatWhen(d: Date) {
  return dateFmt.format(d);
}

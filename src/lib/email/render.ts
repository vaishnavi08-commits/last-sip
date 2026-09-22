import { pickMessage } from "./messages";

export type BasketEmailItem = {
  name: string;
  catalogId: string | null;
  petName: string | null;
  cantWait: boolean;
  off: number; // days until order-by; <=0 means due today
  links: { order: string; ordered: string; plenty: string; basket: string };
};

export type BasketEmailProps = {
  items: BasketEmailItem[];
  mainAppLabel: string;
  manageUrl: string;
};

function dueTag(off: number): string {
  if (off <= 0) return "Order today";
  if (off === 1) return "Order by tomorrow";
  return `Order within ${off} days`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function basketEmailSubject(items: BasketEmailItem[]): string {
  const [first, ...rest] = items;
  const base = `${first.name} needs restocking`;
  return rest.length ? `${base}, and ${rest.length} more ${rest.length === 1 ? "is" : "are"} close behind` : base;
}

// Email clients (Gmail's app and webmail included) have patchy support for
// CSS flexbox, so every side-by-side layout below uses an HTML table
// instead — the one layout technique that renders consistently across
// email clients.
function buttonRow(cells: string[]): string {
  const width = `${Math.floor(100 / cells.length)}%`;
  const tds = cells
    .map((html, i) => {
      const padding = i === 0 ? "0 4px 0 0" : i === cells.length - 1 ? "0 0 0 4px" : "0 4px";
      return `<td width="${width}" style="padding:${padding};">${html}</td>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;"><tr>${tds}</tr></table>`;
}

function miniButton(label: string, href?: string): string {
  const style =
    "display:block;min-height:44px;border-radius:12px;border:1.5px solid #D9CFB6;background:#FFFDF8;text-align:center;font-size:12px;font-weight:700;line-height:1.2;padding:11px 4px;box-sizing:border-box;color:#1F2A24;text-decoration:none;";
  return href
    ? `<a href="${href}" style="${style}">${escapeHtml(label)}</a>`
    : `<div style="${style}">${escapeHtml(label)}</div>`;
}

export function renderBasketEmailHtml({ items, mainAppLabel, manageUrl }: BasketEmailProps): string {
  const n = items.length;
  const first = items[0];
  const intro =
    (first.off <= 0
      ? `${first.name} needs ordering today.`
      : first.off === 1
        ? `${first.name} needs ordering by tomorrow.`
        : `${first.name} needs ordering within ${first.off} days.`) +
    (n > 1 ? " The rest are due soon too, so you can club everything into one order." : "");

  const cards = items
    .map((it, i) => {
      const hot = i === 0;
      const tagBg = hot ? "#F4B93E" : "transparent";
      const tagBd = hot ? "#F4B93E" : "#D9CFB6";
      const message = pickMessage(it.catalogId, it.name, it.petName);
      return `
<div style="background:#FFFDF8;border:1.5px solid #E2D9C3;border-radius:20px;padding:16px;margin:0 0 14px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="font-family:'Bricolage Grotesque',system-ui,sans-serif;font-weight:700;font-size:21px;line-height:1.3;letter-spacing:-0.01em;">${escapeHtml(it.name)}</td>
      <td align="right" valign="middle" style="white-space:nowrap;padding-left:10px;">
        <span style="display:inline-block;padding:4px 10px;border-radius:14px;font-size:13px;font-weight:700;color:#1F2A24;background:${tagBg};border:1.5px solid ${tagBd};">${dueTag(it.off)}</span>
      </td>
    </tr>
  </table>
  <p style="margin:10px 0 12px;font-size:16px;line-height:1.4;color:#3B453F;">${escapeHtml(message)}</p>
  <a href="${it.links.order}" style="display:block;min-height:52px;border-radius:14px;background:#1E5B45;color:#FFFFFF;font-size:16px;font-weight:700;text-align:center;line-height:52px;margin-bottom:8px;text-decoration:none;">Order now on ${escapeHtml(mainAppLabel)}</a>
  ${buttonRow([
    miniButton("I've ordered", it.links.ordered),
    miniButton("Still have plenty", it.links.plenty),
    miniButton("Add to next basket", it.links.basket),
  ])}
</div>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#FAF5EA;">
<div style="max-width:480px;margin:0 auto;background:#FAF5EA;color:#1F2A24;font-family:'Figtree',system-ui,sans-serif;padding:20px 16px 28px;">
  <div style="font-family:'Bricolage Grotesque',system-ui,sans-serif;font-weight:700;font-size:26px;line-height:1.08;letter-spacing:-0.02em;margin-bottom:8px;">Time to restock ${n} thing${n === 1 ? "" : "s"}</div>
  <p style="margin:0 0 18px;font-size:16px;line-height:1.45;color:#3B453F;">${escapeHtml(intro)}</p>
  ${cards}
  <div style="margin-top:6px;padding-top:2px;">
    <p style="margin:0 0 12px;font-size:14px;line-height:1.45;color:#5B655E;">You're getting this because you signed in to Last Sip with Google. One basket email a day at most.</p>
    <a href="${manageUrl}" style="display:block;text-align:center;min-height:44px;line-height:44px;border-radius:12px;border:1.5px solid #1E5B45;color:#1E5B45;font-size:15px;font-weight:700;text-decoration:none;margin-bottom:10px;">Manage my pantry</a>
    ${buttonRow([miniButton("Unsubscribe"), miniButton("Delete my data")])}
  </div>
</div>
</body>
</html>`;
}

# About the user

<!-- Enduring facts: who the user is, how to address them, lasting preferences.
     Kept in mind every turn. Safe to read, grep, and edit.
     One fact per line, as "- (YYYY-MM-DD) <fact>". -->
- (2026-08-17) Fill-up mileage: Enterprise/eFleets supplies the odometer at the fuel-fill time. OneStepGPS supplies distance driven since that time (trip/GPS), because its own mileage/odometer often errors. Last Reading = fill odometer + OneStep distance. API is OneStepGPS JWT RS256 to track.onestepgps.com.
- (2026-08-17) When maintenance odometer Y fights fuel odometer X, Y is a good bet not gospel. Shop is the better prior. A tight in-band fuel climb can still beat a stray shop RO. Do not write Last Reading from shop Y alone.
- (2026-08-17) Zachary will hard-code the last judgment pieces on the oil-change sheet himself (shop vs fuel as gospel, last-known source ranking). Agents should not over-work those. Core remains Enterprise timestamp plus OneStep miles since that second.
- (2026-08-17) Browser tab rule for fleet work: one tab per page per bot (one Automations sorted, one eFleets, one OneStep History). Close leftover login tabs. Aw Snap → blue Reload. Oil sheet writes stay with Oil Change Implementer.
- (2026-08-17) All fleet bots share one Chrome on the box. Do not open a second browser. One tab per page (Automations sorted, eFleets, OneStep History). Oil sheet writes stay with Oil Change Implementer.
- (2026-08-18) eFleets login lives in the shared box Chrome profile (zachary.ferguson.automations). Cookies persist. Start URL: https://login.efleets.com/fleetweb/login (prefilled Log in), then Maintenance DETAIL and Fuel & Charging DETAILS under login.efleets.com/fleetweb/ for company 583424. Reuse the existing Chrome and one eFleets tab. Never open a second browser.

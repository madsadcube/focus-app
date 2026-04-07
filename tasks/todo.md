# Retainer-overblik + Time tracking

## Retainer-overblik

### Plan
- [ ] 1. Tilføj `INIT_RETAINERS` data-konstant (client, fee, services, hoursIncluded, status)
- [ ] 2. Tilføj `retainers` state + updateRetainer funktion i App
- [ ] 3. Tilføj "Retainer" nav-item i sidebar (under Rutiner)
- [ ] 4. Byg `RetainerView` — global oversigt med:
         - Total MRR øverst
         - Kort per klient: månedlig pris, services, status (aktiv/pause/afsluttet)
         - Hurtig-redigering af pris og services
- [ ] 5. Tilføj retainer-panel i ClientView (lille boks øverst i klient-view)
- [ ] 6. Verificer: vite build ren

## Time tracking (fase 2)

### Plan
- [ ] 7. Timer-state i App: `{ taskId, startTime, running }`
         Persist til localStorage så den overlever refresh
- [ ] 8. Start/stop-knap i TaskPanel header
         - "▶ Start" starter timer med taskId + timestamp
         - "⏹ 1h 23m" stopper og logger i aktivitetslog
- [ ] 9. Kørende timer vises som pulserende badge i sidebar + TaskPanel
- [ ] 10. Månedlig time-sum per klient (beregnes fra aktivitetslog-entries der starter med ⏱)
- [ ] 11. Kobl til retainer: "3,5t / 6t brugt denne måned" i retainer-panel
- [ ] 12. Verificer: vite build ren

## Review
(udfyldes efter implementering)

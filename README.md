# Eden telt mee!

Een kleine, aanraakvriendelijke telapp voor een beginnende teller. De standaardinstelling oefent **1 tot 5**. De moeilijkere instelling gaat tot **10**.

De app heeft drie spelvormen: identieke figuren aantikken en tellen, een gevraagde figuur zoeken tussen afleiders en ieder figuurtje één cadeautje geven. De app vraagt nooit om het juiste cijfer te kiezen; na iedere ronde spreekt en toont ze zelf de oplossing met dezelfde figuren die net geteld werden.

## Starten

Open een terminal in deze map en start een eenvoudige lokale webserver, bijvoorbeeld:

```powershell
python -m http.server 4173
```

Open daarna `http://localhost:4173` op een computer of telefoon in hetzelfde netwerk.

Op Android kan de app via het browsermenu aan het startscherm worden toegevoegd. Na het eerste volledige bezoek worden de app en afbeeldingen lokaal bewaard voor offline gebruik.

## Publiceren met GitHub Pages

1. Maak op GitHub een openbare repository, bijvoorbeeld `eden-telt`.
2. Push alle bestanden uit deze map naar de branch `main`.
3. Open in de repository **Settings → Pages**.
4. Kies bij **Build and deployment** voor **Deploy from a branch**.
5. Selecteer **main** en **/(root)** en klik op **Save**.

De app verschijnt vervolgens op `https://<gebruikersnaam>.github.io/eden-telt/`. Open die link één keer in Chrome op de Samsung en kies **App installeren**.

## Peuterstand op Samsung

Een webapp kan de systeemknoppen van Android niet zelf blokkeren. Gebruik daarvoor op de Samsung **Apps vastzetten**:

1. Open **Instellingen → Beveiliging en privacy → Meer beveiligingsinstellingen** en schakel **Apps vastzetten** in.
2. Schakel ontgrendeling met pincode, patroon of wachtwoord in voor het losmaken.
3. Open Eden telt, ga naar **Recente apps**, tik op het app-icoon en kies **Deze app vastzetten**.

De app opent na installatie schermvullend en blijft door Android vastgezet tot een volwassene haar met de toestelbediening losmaakt.

## Ouderinstelling

Via het tandwiel op het beginscherm kan gewisseld worden tussen **makkelijk (1–5)** en **moeilijker (1–10)**.

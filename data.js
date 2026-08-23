// F1 KART LEAGUE - DATA MANAGEMENT
// Sistema punti F1 2025+: 25-18-15-12-10-8-6-4-2-1 (nessun punto giro veloce ufficiale)
// Opzionale: +1 punto giro veloce se finishes nei top 10 (regola 2019-2024)

const F1_POINTS = {
    1: 25,
    2: 18,
    3: 15,
    4: 12,
    5: 10,
    6: 8,
    7: 6,
    8: 4,
    9: 2,
    10: 1
};

const DEFAULT_DATA = {
    piloti: [
        { id: 1, nome: "Marco Rossi", numero: 1 },
        { id: 2, nome: "Luca Bianchi", numero: 2 },
        { id: 3, nome: "Giulia Verdi", numero: 3 },
        { id: 4, nome: "Alessandro Neri", numero: 4 },
        { id: 5, nome: "Sofia Gialli", numero: 5 }
    ],
    
    gare: [
        {
            id: 1,
            data: "2026-03-15",
            pista: "Kartodromo Sicilia",
            stagione: "2026",
            note: "Prima gara stagionale, pista asciutta",
            risultati: [
                { pilotaId: 1, posizione: 1, punti: 25, giroVeloce: false },
                { pilotaId: 2, posizione: 2, punti: 18, giroVeloce: false },
                { pilotaId: 3, posizione: 3, punti: 15, giroVeloce: false },
                { pilotaId: 4, posizione: 4, punti: 12, giroVeloce: false },
                { pilotaId: 5, posizione: 5, punti: 10, giroVeloce: false }
            ]
        },
        {
            id: 2,
            data: "2026-04-12",
            pista: "Autodromo Vallelunga",
            stagione: "2026",
            note: "Gara notturna, molto divertente!",
            risultati: [
                { pilotaId: 3, posizione: 1, punti: 25, giroVeloce: false },
                { pilotaId: 1, posizione: 2, punti: 18, giroVeloce: false },
                { pilotaId: 5, posizione: 3, punti: 15, giroVeloce: false },
                { pilotaId: 2, posizione: 4, punti: 12, giroVeloce: false },
                { pilotaId: 4, posizione: 5, punti: 10, giroVeloce: false }
            ]
        },
        {
            id: 3,
            data: "2026-05-20",
            pista: "Kartodromo Sicilia",
            stagione: "2026",
            note: "Pista bagnata, molti sorpassi",
            risultati: [
                { pilotaId: 2, posizione: 1, punti: 25, giroVeloce: false },
                { pilotaId: 4, posizione: 2, punti: 18, giroVeloce: false },
                { pilotaId: 1, posizione: 3, punti: 15, giroVeloce: false },
                { pilotaId: 3, posizione: 4, punti: 12, giroVeloce: false },
                { pilotaId: 5, posizione: 5, punti: 10, giroVeloce: false }
            ]
        }
    ]
};

// Inizializza dati
function inizializzaDati() {
    if (!localStorage.getItem('f1KartLeagueData')) {
        localStorage.setItem('f1KartLeagueData', JSON.stringify(DEFAULT_DATA));
    }
}

// Ottieni dati
function getDati() {
    const datiSalvati = localStorage.getItem('f1KartLeagueData');
    if (datiSalvati) {
        return JSON.parse(datiSalvati);
    }
    return DEFAULT_DATA;
}

// Salva dati
function salvaDati(dati) {
    localStorage.setItem('f1KartLeagueData', JSON.stringify(dati));
}

// Calcola punti per posizione
function calcolaPunti(posizione, giroVeloce = false) {
    if (!posizione || posizione > 10) return 0;
    
    let punti = F1_POINTS[posizione] || 0;
    
    // Opzionale: punto giro veloce (solo se top 10)
    if (giroVeloce && posizione <= 10) {
        punti += 1;
    }
    
    return punti;
}

// Calcola classifica generale
function calcolaClassifica(stagione = '') {
    const dati = getDati();
    const classifica = {};
    
    // Inizializza tutti i piloti
    dati.piloti.forEach(pilota => {
        classifica[pilota.id] = {
            id: pilota.id,
            nome: pilota.nome,
            numero: pilota.numero,
            gare: 0,
            vittorie: 0,
            podi: 0,
            punti: 0,
            giriVeloci: 0
        };
    });
    
    // Filtra gare per stagione se specificato
    let gareDaProcessare = dati.gare;
    if (stagione) {
        gareDaProcessare = dati.gare.filter(g => g.stagione === stagione);
    }
    
    // Processa tutte le gare
    gareDaProcessare.forEach(gara => {
        gara.risultati.forEach(risultato => {
            const pilota = classifica[risultato.pilotaId];
            if (pilota && risultato.posizione) {
                pilota.gare++;
                pilota.punti += risultato.punti;
                
                if (risultato.posizione === 1) pilota.vittorie++;
                if (risultato.posizione <= 3) pilota.podi++;
                if (risultato.giroVeloce) pilota.giriVeloci++;
            }
        });
    });
    
    // Ordina per punti
    return Object.values(classifica).sort((a, b) => b.punti - a.punti);
}

// Ottieni tutte le piste uniche
function getPiste() {
    const dati = getDati();
    return [...new Set(dati.gare.map(g => g.pista))].sort();
}

// Ottieni tutte le stagioni uniche
function getStagioni() {
    const dati = getDati();
    return [...new Set(dati.gare.map(g => g.stagione))].sort().reverse();
}

// Filtra le gare
function filtraGare(pista = '', stagione = '') {
    const dati = getDati();
    return dati.gare.filter(gara => {
        if (pista && gara.pista !== pista) return false;
        if (stagione && gara.stagione !== stagione) return false;
        return true;
    }).sort((a, b) => new Date(b.data) - new Date(a.data));
}

// Ottieni dettaglio gara
function getDettaglioGara(garaId) {
    const dati = getDati();
    return dati.gare.find(g => g.id === garaId) || null;
}

// Aggiungi nuova gara
function aggiungiGara(garaData) {
    const dati = getDati();
    garaData.id = Date.now();
    dati.gare.push(garaData);
    dati.gare.sort((a, b) => new Date(b.data) - new Date(a.data));
    salvaDati(dati);
    return garaData;
}

// Aggiorna gara esistente
function aggiornaGara(garaId, garaData) {
    const dati = getDati();
    const index = dati.gare.findIndex(g => g.id === garaId);
    
    if (index !== -1) {
        dati.gare[index] = { ...garaData, id: garaId };
        dati.gare.sort((a, b) => new Date(b.data) - new Date(a.data));
        salvaDati(dati);
        return dati.gare[index];
    }
    
    return null;
}

// Elimina gara
function eliminaGara(garaId) {
    const dati = getDati();
    dati.gare = dati.gare.filter(g => g.id !== garaId);
    salvaDati(dati);
}

// Ottieni dettaglio pilota
function getDettaglioPilota(pilotaId) {
    const dati = getDati();
    const pilota = dati.piloti.find(p => p.id === pilotaId);
    if (!pilota) return null;
    
    const garePilota = dati.gare.filter(g => 
        g.risultati.some(r => r.pilotaId === pilotaId)
    );
    
    const statistiche = {
        ...pilota,
        gare: garePilota.length,
        vittorie: 0,
        podi: 0,
        punti: 0,
        giriVeloci: 0,
        gareDettaglio: []
    };
    
    garePilota.forEach(gara => {
        const risultato = gara.risultati.find(r => r.pilotaId === pilotaId);
        if (risultato) {
            statistiche.punti += risultato.punti;
            if (risultato.posizione === 1) statistiche.vittorie++;
            if (risultato.posizione <= 3) statistiche.podi++;
            if (risultato.giroVeloce) statistiche.giriVeloci++;
            
            statistiche.gareDettaglio.push({
                data: gara.data,
                pista: gara.pista,
                posizione: risultato.posizione,
                punti: risultato.punti,
                giroVeloce: risultato.giroVeloce
            });
        }
    });
    
    return statistiche;
}

// Aggiungi nuovo pilota
function aggiungiPilota(nome, numero) {
    const dati = getDati();
    const nuovoId = Math.max(...dati.piloti.map(p => p.id), 0) + 1;
    const nuovoPilota = {
        id: nuovoId,
        nome: nome,
        numero: numero || nuovoId
    };
    dati.piloti.push(nuovoPilota);
    salvaDati(dati);
    return nuovoPilota;
}

// Modifica pilota esistente
function modificaPilota(pilotaId, nome, numero) {
    const dati = getDati();
    const index = dati.piloti.findIndex(p => p.id === pilotaId);
    
    if (index !== -1) {
        dati.piloti[index] = {
            ...dati.piloti[index],
            nome: nome,
            numero: numero || dati.piloti[index].numero
        };
        salvaDati(dati);
        return dati.piloti[index];
    }
    
    return null;
}

// Elimina pilota
function eliminaPilota(pilotaId) {
    const dati = getDati();
    dati.piloti = dati.piloti.filter(p => p.id !== pilotaId);
    salvaDati(dati);
}

// Export API
window.F1KartData = {
    F1_POINTS,
    DEFAULT_DATA,
    inizializzaDati,
    getDati,
    salvaDati,
    calcolaPunti,
    calcolaClassifica,
    getPiste,
    getStagioni,
    filtraGare,
    getDettaglioGara,
    aggiungiGara,
    aggiornaGara,
    eliminaGara,
    getDettaglioPilota,
    aggiungiPilota,
    modificaPilota,
    eliminaPilota
};
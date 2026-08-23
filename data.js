// F1 KART LEAGUE - DATA MANAGEMENT CON FIREBASE
// Sistema punti F1 2025+: 25-18-15-12-10-8-6-4-2-1

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

// Inizializza Firebase
async function inizializzaFirebase() {
    if (!window.db) {
        console.error('Firebase non inizializzato! Controlla firebase-config.js');
        return false;
    }
    return true;
}

// Ottieni tutti i piloti
async function getPiloti() {
    await inizializzaFirebase();
    const pilotiRef = collection(window.db, 'piloti');
    const q = query(pilotiRef, orderBy('numero', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Ottieni tutte le gare
async function getGare() {
    await inizializzaFirebase();
    const gareRef = collection(window.db, 'gare');
    const q = query(gareRef, orderBy('data', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Aggiungi pilota
async function aggiungiPilota(nome, numero) {
    await inizializzaFirebase();
    const piloti = await getPiloti();
    const nuovoId = Math.max(...piloti.map(p => p.id || 0), 0) + 1;
    
    const pilotiRef = collection(window.db, 'piloti');
    const docRef = await addDoc(pilotiRef, {
        id: nuovoId,
        nome: nome,
        numero: numero || nuovoId
    });
    
    return { id: docRef.id, idInterno: nuovoId, nome, numero };
}

// Modifica pilota
async function modificaPilota(pilotaId, nome, numero) {
    await inizializzaFirebase();
    const piloti = await getPiloti();
    const pilota = piloti.find(p => p.id === pilotaId);
    
    if (pilota) {
        const pilotaRef = doc(window.db, 'piloti', pilotaId);
        await updateDoc(pilotaRef, {
            nome: nome,
            numero: numero || pilota.numero
        });
        return { id: pilotaId, nome, numero };
    }
    
    return null;
}

// Elimina pilota
async function eliminaPilota(pilotaId) {
    await inizializzaFirebase();
    const piloti = await getPiloti();
    const pilota = piloti.find(p => p.id === pilotaId);
    
    if (pilota) {
        await deleteDoc(doc(window.db, 'piloti', pilotaId));
    }
}

// Calcola punti per posizione
function calcolaPunti(posizione, giroVeloce = false) {
    if (!posizione || posizione > 10) return 0;
    
    let punti = F1_POINTS[posizione] || 0;
    
    if (giroVeloce && posizione <= 10) {
        punti += 1;
    }
    
    return punti;
}

// Calcola classifica
function calcolaClassifica(piloti, gare, stagione = '') {
    const classifica = {};
    
    piloti.forEach(pilota => {
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
    
    let gareDaProcessare = gare;
    if (stagione) {
        gareDaProcessare = gare.filter(g => g.stagione === stagione);
    }
    
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
    
    return Object.values(classifica).sort((a, b) => b.punti - a.punti);
}

// Ottieni piste uniche
function getPiste(gare) {
    return [...new Set(gare.map(g => g.pista))].sort();
}

// Ottieni stagioni uniche
function getStagioni(gare) {
    return [...new Set(gare.map(g => g.stagione))].sort().reverse();
}

// Filtra gare
function filtraGare(gare, pista = '', stagione = '') {
    return gare.filter(gara => {
        if (pista && gara.pista !== pista) return false;
        if (stagione && gara.stagione !== stagione) return false;
        return true;
    });
}

// Aggiungi gara
async function aggiungiGara(garaData) {
    await inizializzaFirebase();
    const gareRef = collection(window.db, 'gare');
    const docRef = await addDoc(gareRef, garaData);
    return { id: docRef.id, ...garaData };
}

// Aggiorna gara
async function aggiornaGara(garaId, garaData) {
    await inizializzaFirebase();
    const garaRef = doc(window.db, 'gare', garaId);
    await updateDoc(garaRef, garaData);
    return { id: garaId, ...garaData };
}

// Elimina gara
async function eliminaGara(garaId) {
    await inizializzaFirebase();
    await deleteDoc(doc(window.db, 'gare', garaId));
}

// Export API
window.F1KartData = {
    F1_POINTS,
    inizializzaFirebase,
    getPiloti,
    getGare,
    aggiungiPilota,
    modificaPilota,
    eliminaPilota,
    calcolaPunti,
    calcolaClassifica,
    getPiste,
    getStagioni,
    filtraGare,
    aggiungiGara,
    aggiornaGara,
    eliminaGara
};
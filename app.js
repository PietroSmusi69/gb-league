// F1 KART LEAGUE - MAIN APPLICATION

document.addEventListener('DOMContentLoaded', function() {
    // Inizializza dati
    F1KartData.inizializzaDati();
    
    // Navigazione
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewId = item.dataset.view;
            
            // Aggiorna bottoni
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            // Aggiorna viste
            views.forEach(v => v.classList.remove('active'));
            document.getElementById(viewId).classList.add('active');
            
            // Carica contenuti
            if (viewId === 'standings') caricaClassifica();
            if (viewId === 'races') caricaGare();
            if (viewId === 'drivers') caricaPiloti();
            if (viewId === 'manage-drivers') caricaGestionePiloti();
            if (viewId === 'new-race') preparaNuovaGara();
        });
    });
    
    // Carica classifica iniziale
    caricaClassifica();
    
    // Setup modal piloti
    setupDriverModal();
});

// ==================== CLASSIFICA ====================

function caricaClassifica() {
    const seasonSelect = document.getElementById('seasonSelect');
    const stagioneCorrente = seasonSelect.value;
    
    // Popola select stagioni
    if (seasonSelect.options.length === 0) {
        const stagioni = F1KartData.getStagioni();
        stagioni.forEach(stagione => {
            const option = document.createElement('option');
            option.value = stagione;
            option.textContent = stagione;
            seasonSelect.appendChild(option);
        });
        
        // Seleziona prima stagione
        if (stagioni.length > 0) {
            seasonSelect.value = stagioni[0];
        }
        
        // Event listener
        seasonSelect.addEventListener('change', caricaClassifica);
    }
    
    const classifica = F1KartData.calcolaClassifica(seasonSelect.value);
    const dati = F1KartData.getDati();
    
    // Stats
    const gareFiltrate = dati.gare.filter(g => !seasonSelect.value || g.stagione === seasonSelect.value);
    document.getElementById('totalRaces').textContent = gareFiltrate.length;
    document.getElementById('totalDrivers').textContent = dati.piloti.length;
    document.getElementById('totalTracks').textContent = [...new Set(gareFiltrate.map(g => g.pista))].length;
    
    // Tabella
    const tbody = document.getElementById('standingsBody');
    tbody.innerHTML = classifica.map((pilota, index) => `
        <tr class="pos-${index + 1}">
            <td class="col-pos">${index + 1}</td>
            <td class="col-driver">${pilota.nome}</td>
            <td class="col-races">${pilota.gare}</td>
            <td class="col-wins">${pilota.vittorie}</td>
            <td class="col-podiums">${pilota.podi}</td>
            <td class="col-points">${pilota.punti}</td>
        </tr>
    `).join('');
}

// ==================== GARE ====================

function caricaGare() {
    const filterTrack = document.getElementById('filterTrack');
    const filterSeason = document.getElementById('filterSeason');
    
    // Popola filtri
    if (filterTrack.options.length === 1) {
        F1KartData.getPiste().forEach(pista => {
            const option = document.createElement('option');
            option.value = pista;
            option.textContent = pista;
            filterTrack.appendChild(option);
        });
    }
    
    if (filterSeason.options.length === 1) {
        F1KartData.getStagioni().forEach(stagione => {
            const option = document.createElement('option');
            option.value = stagione;
            option.textContent = stagione;
            filterSeason.appendChild(option);
        });
    }
    
    // Filtra e mostra gare
    const gare = F1KartData.filtraGare(filterTrack.value, filterSeason.value);
    const racesList = document.getElementById('racesList');
    
    if (gare.length === 0) {
        racesList.innerHTML = '<p style="text-align:center;padding:40px;color:#888;">Nessuna gara trovata</p>';
    } else {
        racesList.innerHTML = gare.map(gara => {
            const primiTre = gara.risultati
                .filter(r => r.posizione)
                .sort((a, b) => a.posizione - b.posizione)
                .slice(0, 3);
            
            return `
                <div class="race-card" onclick="mostraDettaglioGara(${gara.id})">
                    <div class="race-header">
                        <div class="race-date">📅 ${formatData(gara.data)}</div>
                        <div class="race-track">🏁 ${gara.pista}</div>
                        ${gara.stagione ? `<div class="race-season">🏆 ${gara.stagione}</div>` : ''}
                    </div>
                    <div class="race-results">
                        ${primiTre.map(r => {
                            const pilota = F1KartData.getDati().piloti.find(p => p.id === r.pilotaId);
                            return `
                                <div class="race-result-item">
                                    <span class="result-pos pos-${r.posizione}">#${r.posizione}</span>
                                    <span>${pilota ? pilota.nome : 'Unknown'}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    ${gara.note ? `<p style="margin-top:10px;color:#888;font-size:0.9rem">💬 ${gara.note}</p>` : ''}
                </div>
            `;
        }).join('');
    }
    
    // Event listener filtri
    filterTrack.addEventListener('change', caricaGare);
    filterSeason.addEventListener('change', caricaGare);
}

// ==================== PILOTI ====================

function caricaPiloti() {
    const dati = F1KartData.getDati();
    const driversGrid = document.getElementById('driversGrid');
    const classifica = F1KartData.calcolaClassifica();
    
    driversGrid.innerHTML = dati.piloti.map(pilota => {
        const stats = classifica.find(c => c.id === pilota.id) || {
            gare: 0, vittorie: 0, podi: 0, punti: 0, giriVeloci: 0
        };
        
        const iniziali = pilota.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        return `
            <div class="driver-card">
                <div class="driver-header">
                    <div class="driver-avatar">${iniziali}</div>
                    <div class="driver-name">${pilota.nome}</div>
                </div>
                <div class="driver-stats">
                    <div class="driver-stat">
                        <div class="driver-stat-label">Races</div>
                        <div class="driver-stat-value">${stats.gare}</div>
                    </div>
                    <div class="driver-stat">
                        <div class="driver-stat-label">Wins</div>
                        <div class="driver-stat-value">${stats.vittorie}</div>
                    </div>
                    <div class="driver-stat">
                        <div class="driver-stat-label">Podiums</div>
                        <div class="driver-stat-value">${stats.podi}</div>
                    </div>
                    <div class="driver-stat">
                        <div class="driver-stat-label">Points</div>
                        <div class="driver-stat-value">${stats.punti}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== GESTIONE PILOTI ====================

function caricaGestionePiloti() {
    const dati = F1KartData.getDati();
    const classifica = F1KartData.calcolaClassifica();
    const tbody = document.getElementById('manageDriversBody');
    
    tbody.innerHTML = dati.piloti.map(pilota => {
        const stats = classifica.find(c => c.id === pilota.id) || {
            gare: 0, vittorie: 0, podi: 0, punti: 0
        };
        
        return `
            <tr>
                <td class="col-pos">${pilota.numero || '-'}</td>
                <td class="col-driver">${pilota.nome}</td>
                <td class="col-races">${stats.gare}</td>
                <td class="col-wins">${stats.vittorie}</td>
                <td class="col-podiums">${stats.podi}</td>
                <td class="col-points">${stats.punti}</td>
                <td class="col-actions">
                    <button class="btn-primary btn-small btn-edit" onclick="modificaPilota(${pilota.id})">✏️ Edit</button>
                    <button class="btn-danger btn-small btn-delete" onclick="eliminaPilotaConferma(${pilota.id})">🗑️ Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ==================== MODAL PILOTA ====================

function setupDriverModal() {
    const modal = document.getElementById('driverModal');
    const form = document.getElementById('driverForm');
    
    // Chiudi modal
    document.querySelector('#driverModal .modal-close').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    document.querySelector('#driverModal .modal-overlay').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Submit form
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const pilotaId = document.getElementById('editDriverId').value;
        const nome = document.getElementById('driverName').value.trim();
        const numero = document.getElementById('driverNumber').value ? parseInt(document.getElementById('driverNumber').value) : null;
        
        if (!nome) {
            alert('⚠️ Please enter a name');
            return;
        }
        
        if (pilotaId) {
            // Modifica pilota esistente
            F1KartData.modificaPilota(parseInt(pilotaId), nome, numero);
            alert('✅ Driver updated!');
        } else {
            // Aggiungi nuovo pilota
            F1KartData.aggiungiPilota(nome, numero);
            alert('✅ Driver added!');
        }
        
        modal.classList.remove('active');
        form.reset();
        caricaGestionePiloti();
    });
    
    // Bottone aggiungi nuovo pilota
    document.getElementById('addNewDriverBtn')?.addEventListener('click', () => {
        document.getElementById('driverModalTitle').textContent = 'Add Driver';
        document.getElementById('editDriverId').value = '';
        document.getElementById('driverName').value = '';
        document.getElementById('driverNumber').value = '';
        modal.classList.add('active');
    });
}

// Funzioni globali per i bottoni
window.modificaPilota = function(pilotaId) {
    const pilota = F1KartData.getDati().piloti.find(p => p.id === pilotaId);
    if (!pilota) return;
    
    const modal = document.getElementById('driverModal');
    document.getElementById('driverModalTitle').textContent = 'Edit Driver';
    document.getElementById('editDriverId').value = pilota.id;
    document.getElementById('driverName').value = pilota.nome;
    document.getElementById('driverNumber').value = pilota.numero || '';
    
    modal.classList.add('active');
};

window.eliminaPilotaConferma = function(pilotaId) {
    const pilota = F1KartData.getDati().piloti.find(p => p.id === pilotaId);
    if (!pilota) return;
    
    // Controlla se il pilota ha gare
    const dati = F1KartData.getDati();
    const gareConPilota = dati.gare.filter(g => 
        g.risultati.some(r => r.pilotaId === pilotaId)
    );
    
    if (gareConPilota.length > 0) {
        if (!confirm(`⚠️ ${pilota.nome} ha partecipato a ${gareConPilota.length} gara/e.\n\nEliminandolo, i risultati di queste gare saranno incompleti.\n\nSei sicuro di voler procedere?`)) {
            return;
        }
    } else {
        if (!confirm(`⚠️ Sei sicuro di voler eliminare ${pilota.nome}?`)) {
            return;
        }
    }
    
    F1KartData.eliminaPilota(pilotaId);
    alert('✅ Driver deleted!');
    caricaGestionePiloti();
};

// ==================== NUOVA GARA ====================

function preparaNuovaGara() {
    const container = document.getElementById('resultsContainer');
    const dati = F1KartData.getDati();
    
    // Data odierna
    document.getElementById('raceDate').valueAsDate = new Date();
    
    // Crea righe per ogni pilota
    container.innerHTML = dati.piloti.map((pilota, index) => `
        <div class="result-row" data-pilota-id="${pilota.id}">
            <div>${index + 1}</div>
            <div>${pilota.nome}</div>
            <select class="position-select">
                <option value="">DNP</option>
                ${Array.from({length: Math.max(10, dati.piloti.length)}, (_, i) => `
                    <option value="${i + 1}">${i + 1}⁰</option>
                `).join('')}
            </select>
            <div class="fastest-checkbox">
                <input type="checkbox" class="fastest-lap" id="fastest-${pilota.id}">
                <label for="fastest-${pilota.id}">Fastest</label>
            </div>
            <div class="points-display">0</div>
        </div>
    `).join('');
    
    // Event listener
    document.querySelectorAll('.position-select, .fastest-lap').forEach(el => {
        el.addEventListener('change', aggiornaPuntiForm);
    });
    
    aggiornaPuntiForm();
}

function aggiornaPuntiForm() {
    const righe = document.querySelectorAll('.result-row');
    const posizioniUsate = new Set();
    
    // Reset
    righe.forEach(riga => {
        const posSelect = riga.querySelector('.position-select');
        const fastestCheck = riga.querySelector('.fastest-lap');
        const puntiDisplay = riga.querySelector('.points-display');
        
        const posizione = posSelect.value ? parseInt(posSelect.value) : null;
        
        if (!posizione) {
            // DNP
            riga.classList.add('dnp');
            puntiDisplay.textContent = '0';
            fastestCheck.disabled = true;
        } else if (posizioniUsate.has(posizione)) {
            // Posizione duplicata
            puntiDisplay.textContent = 'ERR';
            puntiDisplay.style.color = '#ff4444';
            fastestCheck.disabled = true;
        } else {
            posizioniUsate.add(posizione);
            riga.classList.remove('dnp');
            
            let punti = F1KartData.F1_POINTS[posizione] || 0;
            const giroVeloce = fastestCheck.checked && posizione <= 10;
            
            // Nota: dal 2025 F1 non assegna più punto giro veloce, ma lo lasciamo come opzione
            if (giroVeloce) {
                punti += 1;
            }
            
            puntiDisplay.textContent = punti;
            puntiDisplay.style.color = posizione <= 3 ? '#e10600' : '#f3f3f3';
            puntiDisplay.style.fontWeight = posizione <= 3 ? '800' : '600';
            fastestCheck.disabled = false;
        }
    });
}

// SALVA NUOVA GARA
document.getElementById('raceForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const risultati = [];
    const righe = document.querySelectorAll('.result-row');
    const posizioniUsate = new Set();
    
    // Raccogli risultati
    righe.forEach(riga => {
        const pilotaId = parseInt(riga.dataset.pilotaId);
        const posSelect = riga.querySelector('.position-select');
        const fastestCheck = riga.querySelector('.fastest-lap');
        
        const posizione = posSelect.value ? parseInt(posSelect.value) : null;
        
        if (!posizione) {
            // DNP - 0 punti
            risultati.push({ pilotaId, posizione: null, punti: 0, giroVeloce: false });
        } else {
            if (posizioniUsate.has(posizione)) {
                alert('⚠️ Errore: Ci sono posizioni duplicate!');
                throw new Error('Posizioni duplicate');
            }
            posizioniUsate.add(posizione);
            
            const giroVeloce = fastestCheck.checked && posizione <= 10;
            const punti = F1KartData.calcolaPunti(posizione, giroVeloce);
            
            risultati.push({ pilotaId, posizione, punti, giroVeloce });
        }
    });
    
    // Crea oggetto gara
    const nuovaGara = {
        data: document.getElementById('raceDate').value,
        pista: document.getElementById('raceTrack').value,
        stagione: document.getElementById('raceSeason').value || new Date().getFullYear().toString(),
        note: document.getElementById('raceNotes').value,
        risultati: risultati.sort((a, b) => {
            if (!a.posizione) return 1;
            if (!b.posizione) return -1;
            return a.posizione - b.posizione;
        })
    };
    
    // Salva
    F1KartData.aggiungiGara(nuovaGara);
    
    // Reset form
    this.reset();
    alert('✅ Gara salvata con successo!');
    
    // Torna alla classifica
    document.querySelector('[data-view="standings"]').click();
});

// ==================== DETTAGLIO GARA (MODAL) ====================

function mostraDettaglioGara(garaId) {
    const gara = F1KartData.getDettaglioGara(garaId);
    if (!gara) return;
    
    const modal = document.getElementById('raceModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = `🏁 ${gara.pista}`;
    
    const dati = F1KartData.getDati();
    const risultatiOrdinati = gara.risultati.sort((a, b) => {
        if (!a.posizione) return 1;
        if (!b.posizione) return -1;
        return a.posizione - b.posizione;
    });
    
    modalBody.innerHTML = `
        <p><strong>📅 Data:</strong> ${formatData(gara.data)}</p>
        ${gara.stagione ? `<p><strong>🏆 Stagione:</strong> ${gara.stagione}</p>` : ''}
        ${gara.note ? `<p><strong>💬 Note:</strong> ${gara.note}</p>` : ''}
        
        <h3 style="margin-top:20px;color:#e10600;text-transform:uppercase;font-size:1.1rem;">Race Results</h3>
        <table class="standings-table" style="margin-top:15px;">
            <thead>
                <tr>
                    <th class="col-pos">Pos</th>
                    <th class="col-driver">Driver</th>
                    <th class="col-points">Points</th>
                    ${gara.risultati.some(r => r.giroVeloce) ? '<th class="col-wins">Fastest</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${risultatiOrdinati.map(r => {
                    const pilota = dati.piloti.find(p => p.id === r.pilotaId);
                    return `
                        <tr class="pos-${r.posizione || 99}">
                            <td class="col-pos">${r.posizione ? '#' + r.posizione : 'DNP'}</td>
                            <td class="col-driver">${pilota ? pilota.nome : 'Unknown'}</td>
                            <td class="col-points">${r.punti}</td>
                            ${gara.risultati.some(r2 => r2.giroVeloce) ? `
                                <td class="col-wins" style="text-align:center;">
                                    ${r.giroVeloce ? '⏱️' : ''}
                                </td>
                            ` : ''}
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    modal.classList.add('active');
    
    // Setup bottoni
    document.getElementById('deleteRaceBtn').onclick = () => eliminaGaraConferma(garaId);
    document.getElementById('editRaceBtn').onclick = () => {
        modal.classList.remove('active');
        apriEditorGara(garaId);
    };
    document.getElementById('closeModalBtn').onclick = () => modal.classList.remove('active');
}

// Chiudi modal cliccando fuori
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function() {
        this.closest('.modal').classList.remove('active');
    });
});

// ==================== EDITOR GARA ====================

function apriEditorGara(garaId) {
    const gara = F1KartData.getDettaglioGara(garaId);
    if (!gara) return;
    
    const modal = document.getElementById('editModal');
    const form = document.getElementById('editRaceForm');
    
    // Popola form
    document.getElementById('editRaceId').value = gara.id;
    document.getElementById('editRaceDate').value = gara.data;
    document.getElementById('editRaceTrack').value = gara.pista;
    document.getElementById('editRaceSeason').value = gara.stagione || '';
    document.getElementById('editRaceNotes').value = gara.note || '';
    
    // Risultati
    const container = document.getElementById('editResultsContainer');
    const dati = F1KartData.getDati();
    
    container.innerHTML = gara.risultati.map((risultato, index) => {
        const pilota = dati.piloti.find(p => p.id === risultato.pilotaId);
        if (!pilota) return '';
        
        return `
            <div class="result-row" data-pilota-id="${pilota.id}">
                <div>${index + 1}</div>
                <div>${pilota.nome}</div>
                <select class="position-select">
                    <option value="">DNP</option>
                    ${Array.from({length: Math.max(10, dati.piloti.length)}, (_, i) => `
                        <option value="${i + 1}" ${risultato.posizione === i + 1 ? 'selected' : ''}>${i + 1}⁰</option>
                    `).join('')}
                </select>
                <div class="fastest-checkbox">
                    <input type="checkbox" class="fastest-lap" id="edit-fastest-${pilota.id}" ${risultato.giroVeloce ? 'checked' : ''} ${!risultato.posizione || risultato.posizione > 10 ? 'disabled' : ''}>
                    <label for="edit-fastest-${pilota.id}">Fastest</label>
                </div>
                <div class="points-display">${risultato.punti}</div>
            </div>
        `;
    }).join('');
    
    // Event listener
    document.querySelectorAll('#editResultsContainer .position-select, #editResultsContainer .fastest-lap').forEach(el => {
        el.addEventListener('change', aggiornaPuntiForm);
    });
    
    aggiornaPuntiForm();
    
    modal.classList.add('active');
}

// SALVA MODIFICA GARA
document.getElementById('editRaceForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const garaId = parseInt(document.getElementById('editRaceId').value);
    const risultati = [];
    const righe = document.querySelectorAll('#editResultsContainer .result-row');
    const posizioniUsate = new Set();
    
    righe.forEach(riga => {
        const pilotaId = parseInt(riga.dataset.pilotaId);
        const posSelect = riga.querySelector('.position-select');
        const fastestCheck = riga.querySelector('.fastest-lap');
        
        const posizione = posSelect.value ? parseInt(posSelect.value) : null;
        
        if (!posizione) {
            risultati.push({ pilotaId, posizione: null, punti: 0, giroVeloce: false });
        } else {
            if (posizioniUsate.has(posizione)) {
                alert('⚠️ Errore: Ci sono posizioni duplicate!');
                throw new Error('Posizioni duplicate');
            }
            posizioniUsate.add(posizione);
            
            const giroVeloce = fastestCheck.checked && posizione <= 10;
            const punti = F1KartData.calcolaPunti(posizione, giroVeloce);
            
            risultati.push({ pilotaId, posizione, punti, giroVeloce });
        }
    });
    
    const garaAggiornata = {
        data: document.getElementById('editRaceDate').value,
        pista: document.getElementById('editRaceTrack').value,
        stagione: document.getElementById('editRaceSeason').value || new Date().getFullYear().toString(),
        note: document.getElementById('editRaceNotes').value,
        risultati: risultati.sort((a, b) => {
            if (!a.posizione) return 1;
            if (!b.posizione) return -1;
            return a.posizione - b.posizione;
        })
    };
    
    F1KartData.aggiornaGara(garaId, garaAggiornata);
    
    alert('✅ Gara aggiornata!');
    document.getElementById('editModal').classList.remove('active');
    document.getElementById('raceModal').classList.remove('active');
    caricaGare();
});

// ==================== ELIMINA GARA ====================

function eliminaGaraConferma(garaId) {
    if (confirm('⚠️ Sei sicuro di voler eliminare questa gara? Questa azione non può essere annullata.')) {
        F1KartData.eliminaGara(garaId);
        document.getElementById('raceModal').classList.remove('active');
        alert('✅ Gara eliminata!');
        caricaGare();
    }
}

// ==================== AGGIUNGI PILOTA (NEL FORM GARA) ====================

document.getElementById('addDriverBtn')?.addEventListener('click', function() {
    const nome = prompt('Nome del pilota (es. Max Verstappen):');
    if (!nome) return;
    
    const numero = prompt('Numero (opzionale):') || '';
    
    F1KartData.aggiungiPilota(nome, numero ? parseInt(numero) : null);
    alert(`✅ Pilota ${nome} aggiunto!`);
    preparaNuovaGara();
});

document.getElementById('editAddDriverBtn')?.addEventListener('click', function() {
    alert('💡 Per aggiungere un nuovo pilota, vai nella sezione "Gestisci Piloti".');
});

// ==================== UTILS ====================

function formatData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Esponi funzioni globali
window.mostraDettaglioGara = mostraDettaglioGara;
window.modificaPilota = modificaPilota;
window.eliminaPilotaConferma = eliminaPilotaConferma;
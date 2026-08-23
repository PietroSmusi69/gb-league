// F1 KART LEAGUE - MAIN APPLICATION CON FIREBASE

let pilotiCache = [];
let gareCache = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Carica dati da Firebase
    await caricaDati();
    
    // Navigazione
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewId = item.dataset.view;
            
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            views.forEach(v => v.classList.remove('active'));
            document.getElementById(viewId).classList.add('active');
            
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

// Carica tutti i dati da Firebase
async function caricaDati() {
    try {
        pilotiCache = await F1KartData.getPiloti();
        gareCache = await F1KartData.getGare();
        console.log('Dati caricati:', pilotiCache.length, 'piloti', gareCache.length, 'gare');
    } catch (error) {
        console.error('Errore nel caricamento dati:', error);
        alert('Errore nel caricamento dei dati. Controlla la console.');
    }
}

// ==================== CLASSIFICA ====================

function caricaClassifica() {
    const seasonSelect = document.getElementById('seasonSelect');
    
    if (seasonSelect.options.length === 0) {
        const stagioni = F1KartData.getStagioni(gareCache);
        stagioni.forEach(stagione => {
            const option = document.createElement('option');
            option.value = stagione;
            option.textContent = stagione;
            seasonSelect.appendChild(option);
        });
        
        if (stagioni.length > 0) {
            seasonSelect.value = stagioni[0];
        }
        
        seasonSelect.addEventListener('change', caricaClassifica);
    }
    
    const classifica = F1KartData.calcolaClassifica(pilotiCache, gareCache, seasonSelect.value);
    
    const gareFiltrate = gareCache.filter(g => !seasonSelect.value || g.stagione === seasonSelect.value);
    document.getElementById('totalRaces').textContent = gareFiltrate.length;
    document.getElementById('totalDrivers').textContent = pilotiCache.length;
    document.getElementById('totalTracks').textContent = F1KartData.getPiste(gareFiltrate).length;
    
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
    
    if (filterTrack.options.length === 1) {
        F1KartData.getPiste(gareCache).forEach(pista => {
            const option = document.createElement('option');
            option.value = pista;
            option.textContent = pista;
            filterTrack.appendChild(option);
        });
    }
    
    if (filterSeason.options.length === 1) {
        F1KartData.getStagioni(gareCache).forEach(stagione => {
            const option = document.createElement('option');
            option.value = stagione;
            option.textContent = stagione;
            filterSeason.appendChild(option);
        });
    }
    
    const gare = F1KartData.filtraGare(gareCache, filterTrack.value, filterSeason.value);
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
                <div class="race-card" onclick="mostraDettaglioGara('${gara.id}')">
                    <div class="race-header">
                        <div class="race-date">📅 ${formatData(gara.data)}</div>
                        <div class="race-track">🏁 ${gara.pista}</div>
                        ${gara.stagione ? `<div class="race-season">🏆 ${gara.stagione}</div>` : ''}
                    </div>
                    <div class="race-results">
                        ${primiTre.map(r => {
                            const pilota = pilotiCache.find(p => p.id === r.pilotaId);
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
    
    filterTrack.addEventListener('change', caricaGare);
    filterSeason.addEventListener('change', caricaGare);
}

// ==================== PILOTI ====================

function caricaPiloti() {
    const driversGrid = document.getElementById('driversGrid');
    const classifica = F1KartData.calcolaClassifica(pilotiCache, gareCache);
    
    driversGrid.innerHTML = pilotiCache.map(pilota => {
        const stats = classifica.find(c => c.id === pilota.id) || {
            gare: 0, vittorie: 0, podi: 0, punti: 0
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
    const classifica = F1KartData.calcolaClassifica(pilotiCache, gareCache);
    const tbody = document.getElementById('manageDriversBody');
    
    tbody.innerHTML = pilotiCache.map(pilota => {
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
    
    document.querySelector('#driverModal .modal-close').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    document.querySelector('#driverModal .modal-overlay').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const pilotaId = document.getElementById('editDriverId').value;
        const nome = document.getElementById('driverName').value.trim();
        const numero = document.getElementById('driverNumber').value ? parseInt(document.getElementById('driverNumber').value) : null;
        
        if (!nome) {
            alert('⚠️ Please enter a name');
            return;
        }
        
        try {
            if (pilotaId) {
                await F1KartData.modificaPilota(parseInt(pilotaId), nome, numero);
                alert('✅ Driver updated!');
            } else {
                await F1KartData.aggiungiPilota(nome, numero);
                alert('✅ Driver added!');
            }
            
            modal.classList.remove('active');
            form.reset();
            await caricaDati();
            caricaGestionePiloti();
        } catch (error) {
            console.error('Errore:', error);
            alert('❌ Errore nel salvataggio');
        }
    });
    
    document.getElementById('addNewDriverBtn')?.addEventListener('click', () => {
        document.getElementById('driverModalTitle').textContent = 'Add Driver';
        document.getElementById('editDriverId').value = '';
        document.getElementById('driverName').value = '';
        document.getElementById('driverNumber').value = '';
        modal.classList.add('active');
    });
}

window.modificaPilota = function(pilotaId) {
    const pilota = pilotiCache.find(p => p.id === pilotaId);
    if (!pilota) return;
    
    const modal = document.getElementById('driverModal');
    document.getElementById('driverModalTitle').textContent = 'Edit Driver';
    document.getElementById('editDriverId').value = pilota.id;
    document.getElementById('driverName').value = pilota.nome;
    document.getElementById('driverNumber').value = pilota.numero || '';
    
    modal.classList.add('active');
};

window.eliminaPilotaConferma = async function(pilotaId) {
    const pilota = pilotiCache.find(p => p.id === pilotaId);
    if (!pilota) return;
    
    const gareConPilota = gareCache.filter(g => 
        g.risultati.some(r => r.pilotaId === pilotaId)
    );
    
    if (gareConPilota.length > 0) {
        if (!confirm(`⚠️ ${pilota.nome} ha partecipato a ${gareConPilota.length} gara/e.\n\nEliminandolo, i risultati saranno incompleti.\n\nProcedere?`)) {
            return;
        }
    } else {
        if (!confirm(`⚠️ Eliminare ${pilota.nome}?`)) {
            return;
        }
    }
    
    try {
        await F1KartData.eliminaPilota(pilotaId);
        alert('✅ Driver deleted!');
        await caricaDati();
        caricaGestionePiloti();
    } catch (error) {
        console.error('Errore:', error);
        alert('❌ Errore nell\'eliminazione');
    }
};

// ==================== NUOVA GARA ====================

function preparaNuovaGara() {
    const container = document.getElementById('resultsContainer');
    
    document.getElementById('raceDate').valueAsDate = new Date();
    
    container.innerHTML = pilotiCache.map((pilota, index) => `
        <div class="result-row" data-pilota-id="${pilota.id}">
            <div>${index + 1}</div>
            <div>${pilota.nome}</div>
            <select class="position-select">
                <option value="">DNP</option>
                ${Array.from({length: Math.max(10, pilotiCache.length)}, (_, i) => `
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
    
    document.querySelectorAll('.position-select, .fastest-lap').forEach(el => {
        el.addEventListener('change', aggiornaPuntiForm);
    });
    
    aggiornaPuntiForm();
}

function aggiornaPuntiForm() {
    const righe = document.querySelectorAll('.result-row');
    const posizioniUsate = new Set();
    
    righe.forEach(riga => {
        const posSelect = riga.querySelector('.position-select');
        const fastestCheck = riga.querySelector('.fastest-lap');
        const puntiDisplay = riga.querySelector('.points-display');
        
        const posizione = posSelect.value ? parseInt(posSelect.value) : null;
        
        if (!posizione) {
            riga.classList.add('dnp');
            puntiDisplay.textContent = '0';
            fastestCheck.disabled = true;
        } else if (posizioniUsate.has(posizione)) {
            puntiDisplay.textContent = 'ERR';
            puntiDisplay.style.color = '#ff4444';
            fastestCheck.disabled = true;
        } else {
            posizioniUsate.add(posizione);
            riga.classList.remove('dnp');
            
            let punti = F1KartData.F1_POINTS[posizione] || 0;
            const giroVeloce = fastestCheck.checked && posizione <= 10;
            
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

document.getElementById('raceForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const risultati = [];
    const righe = document.querySelectorAll('.result-row');
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
                alert('⚠️ Posizioni duplicate!');
                throw new Error('Posizioni duplicate');
            }
            posizioniUsate.add(posizione);
            
            const giroVeloce = fastestCheck.checked && posizione <= 10;
            const punti = F1KartData.calcolaPunti(posizione, giroVeloce);
            
            risultati.push({ pilotaId, posizione, punti, giroVeloce });
        }
    });
    
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
    
    try {
        await F1KartData.aggiungiGara(nuovaGara);
        this.reset();
        alert('✅ Gara salvata!');
        await caricaDati();
        document.querySelector('[data-view="standings"]').click();
    } catch (error) {
        console.error('Errore:', error);
        alert('❌ Errore nel salvataggio');
    }
});

// ==================== DETTAGLIO GARA ====================

window.mostraDettaglioGara = async function(garaId) {
    const gare = await F1KartData.getGare();
    const gara = gare.find(g => g.id === garaId);
    if (!gara) return;
    
    const modal = document.getElementById('raceModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = `🏁 ${gara.pista}`;
    
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
                    const pilota = pilotiCache.find(p => p.id === r.pilotaId);
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
    
    document.getElementById('deleteRaceBtn').onclick = () => eliminaGaraConferma(gara.id);
    document.getElementById('editRaceBtn').onclick = () => {
        modal.classList.remove('active');
        apriEditorGara(gara);
    };
    document.getElementById('closeModalBtn').onclick = () => modal.classList.remove('active');
};

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function() {
        this.closest('.modal').classList.remove('active');
    });
});

// ==================== EDITOR GARA ====================

async function apriEditorGara(gara) {
    const modal = document.getElementById('editModal');
    const form = document.getElementById('editRaceForm');
    
    document.getElementById('editRaceId').value = gara.id;
    document.getElementById('editRaceDate').value = gara.data;
    document.getElementById('editRaceTrack').value = gara.pista;
    document.getElementById('editRaceSeason').value = gara.stagione || '';
    document.getElementById('editRaceNotes').value = gara.note || '';
    
    const container = document.getElementById('editResultsContainer');
    
    container.innerHTML = gara.risultati.map((risultato, index) => {
        const pilota = pilotiCache.find(p => p.id === risultato.pilotaId);
        if (!pilota) return '';
        
        return `
            <div class="result-row" data-pilota-id="${pilota.id}">
                <div>${index + 1}</div>
                <div>${pilota.nome}</div>
                <select class="position-select">
                    <option value="">DNP</option>
                    ${Array.from({length: Math.max(10, pilotiCache.length)}, (_, i) => `
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
    
    document.querySelectorAll('#editResultsContainer .position-select, #editResultsContainer .fastest-lap').forEach(el => {
        el.addEventListener('change', aggiornaPuntiForm);
    });
    
    aggiornaPuntiForm();
    modal.classList.add('active');
}

document.getElementById('editRaceForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const garaId = document.getElementById('editRaceId').value;
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
                alert('⚠️ Posizioni duplicate!');
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
    
    try {
        await F1KartData.aggiornaGara(garaId, garaAggiornata);
        alert('✅ Gara aggiornata!');
        document.getElementById('editModal').classList.remove('active');
        document.getElementById('raceModal').classList.remove('active');
        await caricaDati();
        caricaGare();
    } catch (error) {
        console.error('Errore:', error);
        alert('❌ Errore nell\'aggiornamento');
    }
});

// ==================== ELIMINA GARA ====================

async function eliminaGaraConferma(garaId) {
    if (confirm('⚠️ Eliminare questa gara?')) {
        try {
            await F1KartData.eliminaGara(garaId);
            alert('✅ Gara eliminata!');
            document.getElementById('raceModal').classList.remove('active');
            await caricaDati();
            caricaGare();
        } catch (error) {
            console.error('Errore:', error);
            alert('❌ Errore nell\'eliminazione');
        }
    }
}

// ==================== UTILS ====================

function formatData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}
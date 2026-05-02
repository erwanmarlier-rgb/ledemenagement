const carte = L.map('carte').setView([49.09, 0.60], 7);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap © CartoDB',
  maxZoom: 19
}).addTo(carte);

let communes = [];
let cercles = [];

fetch('data/communes.json')
  .then(reponse => reponse.json())
  .then(donnees => {
    communes = donnees;
    console.log(`✅ ${communes.length} communes chargées`);
    afficherCommunes(communes);
  })
  .catch(erreur => {
    console.error('❌ Erreur chargement communes.json :', erreur);
  });

function afficherCommunes(liste) {
  cercles.forEach(c => carte.removeLayer(c));
  cercles = [];

  liste.forEach(function(commune) {
    var cercle = L.circleMarker([commune.lat, commune.lon], {
      radius: 5,
      color: '#2a9d8f',
      fillColor: '#2a9d8f',
      fillOpacity: 0.6,
      weight: 1
    });

    var prix   = commune.prix_m2 ? commune.prix_m2 + ' €/m²' : 'Non disponible';
    var sante  = commune.sante_nom ? commune.sante_categorie + ' — ' + commune.distance_sante_km + ' km' : 'Non disponible';
    var statut = commune.statut !== 'aucun' ? commune.statut : 'Aucun';

    var tempsH   = Math.floor(commune.temps_lambersart_min / 60);
    var tempsM   = commune.temps_lambersart_min % 60;
    var tempsAff = tempsH > 0 ? tempsH + 'h' + String(tempsM).padStart(2, '0') : tempsM + ' min';
	
	var lienLbc = 'https://www.leboncoin.fr/recherche?category=9'
  + '&locations=' + encodeURIComponent(commune.nom)
  + '&real_estate_type=1';

    var contenu = '<div class="popup">'
      + '<h3>' + commune.nom + '</h3>'
      + '<table>'
      + '<tr><td>📮 Code postal</td><td>' + commune.cp + '</td></tr>'
      + '<tr><td>👥 Population</td><td>' + commune.population.toLocaleString('fr-FR') + ' hab.</td></tr>'
      + '<tr><td>📍 Distance Lambersart</td><td>' + commune.dist_lambersart_km + ' km</td></tr>'
      + '<tr><td>⏱️ Temps Lambersart</td><td>' + tempsAff + '</td></tr>'
      + '<tr><td>💶 Prix médian</td><td>' + prix + '</td></tr>'
      + '<tr><td>🏥 Santé</td><td>' + sante + '</td></tr>'
      + '<tr><td>🌿 Label bon vivre</td><td>' + statut + '</td></tr>'
      + '</table>'
	  + '<a href="' + lienLbc + '" target="_blank" class="btn-lbc">🔍 Voir les annonces</a>'
      + '</div>';

    cercle.bindPopup(contenu);
    cercle.addTo(carte);
    cercles.push(cercle);
  });

  document.getElementById('compteur').textContent = liste.length + ' communes affichées';
}

// Affichage des valeurs en temps réel sur les sliders
document.getElementById('filtre-temps').addEventListener('input', function() {
  const totalMin = parseInt(this.value);
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  const affichage = h > 0 ? `${h}h${min.toString().padStart(2, '0')}` : `${min} min`;
  document.getElementById('val-temps').textContent = affichage;
  appliquerFiltres();
});


document.getElementById('filtre-hopital').addEventListener('input', function() {
  document.getElementById('val-hopital').textContent = this.value + ' km';
  appliquerFiltres();
});

document.getElementById('filtre-prix').addEventListener('input', function() {
  document.getElementById('val-prix').textContent = this.value + ' €';
  appliquerFiltres();
});

document.getElementById('filtre-littoral').addEventListener('change', appliquerFiltres);
document.getElementById('filtre-bonvivre').addEventListener('change', appliquerFiltres);

function appliquerFiltres() {
  const maxTemps   = parseInt(document.getElementById('filtre-temps').value);
  const maxHopital = parseInt(document.getElementById('filtre-hopital').value);
  const maxPrix    = parseInt(document.getElementById('filtre-prix').value);
  const littoral   = document.getElementById('filtre-littoral').value;
  const bonvivre   = document.getElementById('filtre-bonvivre').value;

  const filtrees = communes.filter(c => {
    if (c.temps_lambersart_min > maxTemps) return false;
    if (c.distance_sante_km > maxHopital) return false;
    if (c.prix_m2 > maxPrix) return false;
    if (littoral == 'direct' && c.littoral !== 'direct') return false;
	if (littoral == 'proche' && c.littoral == 'non') return false;
    if (bonvivre === 'labelisee'   && c.statut !== 'labelisee') return false;
    if (bonvivre === 'labelisable' && c.statut == 'aucun') return false;
    return true;
  });

  afficherCommunes(filtrees);
}

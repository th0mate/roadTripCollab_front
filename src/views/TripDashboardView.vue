<template>
  <div v-if="loading" class="loading-container">
    Chargement du voyage...
  </div>

  <div v-else-if="error" class="error-container">
    {{ error }}
  </div>

  <div v-else class="dashboard-container">
    <div class="trip-header">
      <div class="header-content">
        <h1>{{ trip.title }}</h1>
        <div class="dates-badge">
          📅 {{ formatDateRange(trip.startDate, trip.endDate) }}
        </div>
        <p v-if="trip.description" class="description">{{ trip.description }}</p>
      </div>
      <div class="trip-meta">
        <div class="status-box" :class="trip.status">
          {{ formatStatus(trip.status) }}
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="itinerary-column">
        <div class="section-card budget-section">
          <div class="section-header">
            <h2>Cagnotte & Dépenses</h2>
            <button class="btn-small" @click="showExpenseModal = true">+ Dépense</button>
          </div>

          <div class="budget-summary">
            <div class="budget-item">
              <span class="label">Budget Total</span>
              <span class="value">{{ trip.budget }} €</span>
            </div>
            <div class="budget-item expenses">
              <span class="label">Dépensé</span>
              <span class="value">{{ totalExpenses }} €</span>
            </div>
            <div class="budget-item remaining" :class="{ negative: remainingBudget < 0 }">
              <span class="label">Reste</span>
              <span class="value">{{ remainingBudget }} €</span>
            </div>
          </div>

          <div class="fuel-estimation" v-if="estimatedFuelCost > 0">
            <span class="fuel-icon">⛽</span>
            <span class="fuel-text">Coût essence estimé : <strong>{{ estimatedFuelCost.toFixed(2) }} €</strong></span>
            <small>({{ trip?.carConsumption }}L/100km à {{ trip?.fuelPrice }}€/L)</small>
          </div>

          <div class="fuel-estimation toll-estimation" v-if="!routeSettings.avoidTolls">
            <span class="fuel-icon">🛣️</span>
            <span class="fuel-text">Coût péage estimé : <strong>{{ estimatedTollCost.toFixed(2) }} €</strong></span>
            <small>(Moyenne {{ routeSettings.tollRate }}€/km sur sections payantes)</small>
          </div>

          <div class="expenses-list" v-if="trip.expenses && trip.expenses.length > 0">
            <h3>Dernières dépenses</h3>
            <div v-for="expense in trip.expenses.slice(0, 3)" :key="expense.id" class="expense-item clickable" @click="openEditExpenseModal(expense)">
              <div class="expense-icon" :class="expense.category">
                {{ getCategoryIcon(expense.category) }}
              </div>
              <div class="expense-details">
                <span class="expense-title">{{ expense.title }}</span>
                <span class="expense-payer">Payé par {{ expense.payer?.fullName || '?' }}</span>
              </div>
              <span class="expense-amount">-{{ expense.amount }} €</span>
              <button class="btn-icon delete" @click.stop="openDeleteModal('expense', expense)" title="Supprimer">
                🗑️
              </button>
            </div>
            <button class="btn-link" v-if="trip.expenses.length > 3">Voir tout</button>
          </div>
          <div v-else class="empty-text">
            Aucune dépense enregistrée.
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <h2>Itinéraire</h2>
          </div>

          <div class="days-container">
            <div v-for="(day, index) in itineraryByDay" :key="index" class="day-group">
              <div class="day-header">
                <div class="day-date">
                  <span class="day-number">Jour {{ index + 1 }}</span>
                  <span class="day-date-text">{{ formatDate(day.date) }}</span>
                </div>
                <div class="day-city">
                  📍 {{ day.city ? day.city.title : 'Aucune étape définie' }}
                </div>
              </div>

              <div class="day-activities">
                <div v-for="activity in day.activities" :key="activity.id" class="activity-item">
                  <div class="activity-icon">{{ getStopIcon(activity.type) }}</div>
                  <div class="activity-info">
                    <span class="activity-title">{{ activity.title }}</span>
                    <span class="activity-type">{{ formatStopType(activity.type) }}</span>
                  </div>
                  <button class="btn-icon delete" @click="openDeleteModal('stop', activity)" title="Supprimer">
                    🗑️
                  </button>
                </div>
                <button class="btn-add-activity" @click="openAddActivityModal(day.date)">
                  + Ajouter une activité
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <h2>Participants</h2>
            <button class="btn-small" @click="showInviteModal = true">+ Inviter</button>
          </div>
          <div class="participants-list">
            <div v-for="participant in trip.participants" :key="participant.id" class="participant-item">
              <div class="avatar">{{ getInitials(participant.fullName) }}</div>
              <div class="participant-info">
                <span class="name">{{ participant.fullName }}</span>
                <span class="email">{{ participant.email }}</span>
              </div>

              <template v-if="getParticipantAction(participant)">
                <button
                  class="btn-icon"
                  :class="getParticipantAction(participant) === 'leave' ? 'leave' : 'delete'"
                  @click="openDeleteModal('participant', participant)"
                  :title="getParticipantAction(participant) === 'leave' ? 'Quitter le voyage' : 'Retirer du voyage'"
                >
                  {{ getParticipantAction(participant) === 'leave' ? '🚪' : '🗑️' }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="map-column">
        <div class="map-header-overlay">
          <h2>Carte</h2>
          <button class="btn-small" @click="openRouteSettings">⚙️ Options Trajet</button>
        </div>
        <div class="map-wrapper" id="trip-map"></div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="showRouteSettingsModal" class="modal-overlay" @click.self="showRouteSettingsModal = false">
      <div class="modal-content">
        <h3>Options d'Itinéraire</h3>
        <form @submit.prevent="saveRouteSettings">
          <div class="form-group">
            <label>Consommation Voiture (L/100km)</label>
            <input type="number" step="0.1" v-model="routeSettings.carConsumption" required />
          </div>
          <div class="form-group">
            <label>Prix Moyen Carburant (€/L)</label>
            <input type="number" step="0.01" v-model="routeSettings.fuelPrice" required />
          </div>
          <div class="form-group">
            <label>Coût Péage Moyen (€/km)</label>
            <input type="number" step="0.01" v-model="routeSettings.tollRate" required />
            <small style="color: #7f8c8d; font-size: 0.8rem;">Moyenne France: 0.12€/km (Autoroute)</small>
          </div>
          <div class="form-group">
            <label>Préférence de Route</label>
            <select v-model="routeSettings.routingPreference">
              <option value="fastest">Le plus rapide</option>
              <option value="shortest">Le plus court</option>
            </select>
          </div>
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="routeSettings.avoidTolls" />
              Éviter les péages (si possible)
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showRouteSettingsModal = false">Annuler</button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">Enregistrer & Recalculer</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showEditExpenseModal" class="modal-overlay" @click.self="showEditExpenseModal = false">
      <div class="modal-content">
        <h3>Modifier la dépense</h3>
        <form @submit.prevent="updateExpense">
          <div class="form-group">
            <label>Titre</label>
            <input v-model="editingExpense.title" required />
          </div>
          <div class="form-group">
            <label>Montant (€)</label>
            <input type="number" v-model="editingExpense.amount" required min="0" step="0.01" />
          </div>
          <div class="form-group">
            <label>Payé par</label>
            <select v-model="editingExpense.paidBy" required>
              <option v-for="p in trip.participants" :key="p.id" :value="p.id">
                {{ p.id === currentUser?.id ? 'Moi' : p.fullName }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Catégorie</label>
            <select v-model="editingExpense.category" required>
              <option value="fuel">Essence</option>
              <option value="tolls">Péage</option>
              <option value="food">Nourriture</option>
              <option value="accommodation">Logement</option>
              <option value="activity">Activité</option>
              <option value="transport">Transport</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div class="form-group">
            <label>Date</label>
            <input type="date" v-model="editingExpense.expenseDate" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showEditExpenseModal = false">Annuler</button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showExpenseModal" class="modal-overlay" @click.self="showExpenseModal = false">
      <div class="modal-content">
        <h3>Ajouter une dépense</h3>
        <form @submit.prevent="createExpense">
          <div class="form-group">
            <label>Titre</label>
            <input v-model="newExpense.title" required placeholder="Ex: Plein d'essence" />
          </div>
          <div class="form-group">
            <label>Montant (€)</label>
            <input type="number" v-model="newExpense.amount" required min="0" step="0.01" />
          </div>
          <div class="form-group">
            <label>Payé par</label>
            <select v-model="newExpense.paidBy" required>
              <option v-for="p in trip.participants" :key="p.id" :value="p.id">
                {{ p.id === currentUser?.id ? 'Moi' : p.fullName }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Catégorie</label>
            <select v-model="newExpense.category" required>
              <option value="fuel">Essence</option>
              <option value="tolls">Péage</option>
              <option value="food">Nourriture</option>
              <option value="accommodation">Logement</option>
              <option value="activity">Activité</option>
              <option value="transport">Transport</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div class="form-group">
            <label>Date</label>
            <input type="date" v-model="newExpense.date" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showExpenseModal = false">Annuler</button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">Ajouter</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showStopModal" class="modal-overlay" @click.self="showStopModal = false">
      <div class="modal-content">
        <h3>Ajouter une activité pour le {{ formatDate(newStop.arrivalDate) }}</h3>
        <div class="form-group">
          <label>Rechercher un lieu</label>
          <div class="search-input-wrapper">
            <input
              type="text"
              v-model="locationSearch"
              @input="searchLocation"
              placeholder="Restaurant, Musée..."
            />
            <ul v-if="searchResults.length > 0" class="search-results">
              <li v-for="result in searchResults" :key="result.place_id" @click="selectLocation(result)">
                {{ result.display_name }}
              </li>
            </ul>
          </div>
        </div>

        <form v-if="newStop.latitude" @submit.prevent="addStop">
          <div class="selected-location">
            <strong>Lieu sélectionné :</strong> {{ newStop.title }}
          </div>
          <div class="form-group">
            <label>Type d'activité</label>
            <select v-model="newStop.type" required>
              <option value="accommodation">🏨 Hébergement (Hôtel, Camping...)</option>
              <option value="restaurant">🍴 Restauration (Resto, Snack...)</option>
              <option value="activity">🎟️ Activité (Musée, Parc...)</option>
              <option value="poi">📍 Point d'intérêt (Lac, Vue...)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Prix estimé (€)</label>
            <input type="number" v-model="newStop.price" min="0" step="0.01" placeholder="0.00 (laisser vide si gratuit)" />
          </div>
          <div class="form-group" v-if="newStop.price > 0">
            <label>Payé par</label>
            <select v-model="newStop.paidBy">
              <option v-for="p in trip.participants" :key="p.id" :value="p.id">
                {{ p.id === currentUser?.id ? 'Moi' : p.fullName }}
              </option>
            </select>
          </div>
          <!-- Date hidden as it is pre-selected -->
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showStopModal = false">Annuler</button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">Ajouter</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showInviteModal" class="modal-overlay" @click.self="showInviteModal = false">
      <div class="modal-content">
        <h3>Inviter un participant</h3>
        <form @submit.prevent="inviteParticipant">
          <div class="form-group">
            <label>Email du participant</label>
            <input type="email" v-model="inviteEmail" required placeholder="ami@exemple.com" />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showInviteModal = false">Annuler</button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">Inviter</button>
          </div>
        </form>
      </div>
    </div>

    <AppModal
      v-model="showDeleteConfirmModal"
      type="danger"
      :title="itemToDelete?.action === 'leave' ? 'Quitter le voyage' : `Supprimer ${itemToDelete?.type === 'participant' ? 'le participant' : (itemToDelete?.type === 'stop' ? 'l\'activité' : 'la dépense')}`"
      :message="itemToDelete?.action === 'leave' ? 'Êtes-vous sûr de vouloir quitter ce voyage ?' : `Êtes-vous sûr de vouloir supprimer '${itemToDelete?.name}' ?`"
      :confirm-text="itemToDelete?.action === 'leave' ? 'Quitter' : 'Supprimer'"
      cancel-text="Annuler"
      @confirm="confirmDeleteItem"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';
import { getMe } from '../services/authService';
import type { Trip, Stop } from '../types/trip';
import type { User } from '../types/user';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

import AppModal from '../components/AppModal.vue';

const DefaultIcon = L.icon({
  iconUrl: iconUrl,
  iconRetinaUrl: iconRetinaUrl,
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const route = useRoute();
const vueRouter = useRouter();
const loading = ref(true);
const error = ref('');
const trip = ref<Trip | null>(null);
const currentUser = ref<User | null>(null);
let map: L.Map | null = null;
let markers: L.Marker[] = [];
let routingControls: any[] = [];

const showExpenseModal = ref(false);
const showStopModal = ref(false);
const showInviteModal = ref(false);
const showRouteSettingsModal = ref(false);
const showDeleteConfirmModal = ref(false);
const showEditExpenseModal = ref(false);
const isSubmitting = ref(false);

const itemToDelete = ref<{ type: 'expense' | 'stop' | 'participant'; id: number; name: string; extraId?: number; action?: string } | null>(null);
const editingExpense = ref<any>(null);

const openEditExpenseModal = (expense: any) => {
  editingExpense.value = {
    ...expense,
    expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0]
  };
  showEditExpenseModal.value = true;
};

const updateExpense = async () => {
  if (!editingExpense.value) return;
  isSubmitting.value = true;
  try {
    await api.patch(`/expenses/${editingExpense.value.id}`, {
      title: editingExpense.value.title,
      amount: editingExpense.value.amount,
      category: editingExpense.value.category,
      paidBy: editingExpense.value.paidBy,
      expenseDate: editingExpense.value.expenseDate
    });

    showEditExpenseModal.value = false;
    editingExpense.value = null;
    await fetchTripDetails();
  } catch (e) {
    console.error(e);
    alert("Erreur lors de la modification de la dépense");
  } finally {
    isSubmitting.value = false;
  }
};

const getParticipantAction = (participant: any): 'remove' | 'leave' | null => {
  if (!trip.value || !currentUser.value) return null;

  const isCreator = trip.value.creatorId === currentUser.value.id;
  const isMe = participant.id === currentUser.value.id;

  if (isCreator) {
    return isMe ? null : 'remove';
  } else {
    return isMe ? 'leave' : null;
  }
};

const openDeleteModal = (type: 'expense' | 'stop' | 'participant', item: any) => {
  let name = '';
  let id = item.id;
  let extraId = undefined;

  if (type === 'expense') name = item.title;
  if (type === 'stop') name = item.title;
  if (type === 'participant') {
    const action = getParticipantAction(item);
    if (!action) return;

    name = item.fullName;
    extraId = item.id;

    if (action === 'leave') {
       itemToDelete.value = { type, id, name, extraId, action: 'leave' };
       showDeleteConfirmModal.value = true;
       return;
    }
  }

  itemToDelete.value = { type, id, name, extraId };
  showDeleteConfirmModal.value = true;
};

const confirmDeleteItem = async () => {
  if (!itemToDelete.value || !trip.value) return;

  isSubmitting.value = true;
  try {
    if (itemToDelete.value.type === 'expense') {
      await api.delete(`/expenses/${itemToDelete.value.id}`);
    } else if (itemToDelete.value.type === 'stop') {
      await api.delete(`/stops/${itemToDelete.value.id}`);
    } else if (itemToDelete.value.type === 'participant') {
      await api.delete(`/trips/${trip.value.id}/participants/${itemToDelete.value.extraId}`);

      if (itemToDelete.value.action === 'leave') {
         vueRouter.push('/my-trips');
         return;
      }
    }

    showDeleteConfirmModal.value = false;
    itemToDelete.value = null;
    await fetchTripDetails();
  } catch (e) {
    console.error(e);
    alert("Erreur lors de la suppression");
  } finally {
    isSubmitting.value = false;
  }
};

const estimatedFuelCost = ref(0);
const estimatedTollCost = ref(0);
const routeSettings = ref({
  carConsumption: 7.0,
  fuelPrice: 1.80,
  tollRate: 0.12,
  routingPreference: 'fastest',
  avoidTolls: false
});

const newExpense = ref({
  title: '',
  amount: 0,
  category: 'food',
  paidBy: null as number | null,
  date: new Date().toISOString().split('T')[0]
});

const inviteEmail = ref('');

const locationSearch = ref('');
const searchResults = ref<any[]>([]);
const newStop = ref<any>({
  title: '',
  latitude: null,
  longitude: null,
  type: 'activity',
  price: 0,
  paidBy: null,
  arrivalDate: '',
  departureDate: ''
});
let searchTimeout: any = null;


const fetchTripDetails = async () => {
  try {
    const id = route.params.id;
    const response = await api.get(`/trips/${id}`);
    trip.value = response.data;

    if (trip.value) {
      routeSettings.value = {
        carConsumption: trip.value.carConsumption || 7.0,
        fuelPrice: trip.value.fuelPrice || 1.80,
        tollRate: (trip.value as any).tollRate || 0.12,
        routingPreference: 'fastest',
        avoidTolls: false
      };
    }

    loading.value = false;
    await nextTick();
    initMap();

  } catch (err: any) {
    console.error('Error loading trip:', err);
    error.value = "Impossible de charger les détails du voyage.";
    loading.value = false;
  }
};

const totalExpenses = computed(() => {
  if (!trip.value?.expenses) return 0;
  return trip.value.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
});

const remainingBudget = computed(() => {
  if (!trip.value) return 0;
  return Number(trip.value.budget) - totalExpenses.value;
});

const itineraryByDay = computed(() => {
  if (!trip.value) return [];

  const start = new Date(trip.value.startDate);
  const end = new Date(trip.value.endDate);
  const days: { date: string; city: Stop | null; activities: Stop[] }[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const currentDateStr = d.toISOString().split('T')[0];

    const stopsForDay = trip.value.stops.filter(s => {
      return s.arrivalDate && s.arrivalDate.substring(0, 10) === currentDateStr;
    });

    const city = stopsForDay.find(s => s.type === 'city') || null;

    const activities = stopsForDay.filter(s => s.type !== 'city');

    days.push({
      date: currentDateStr,
      city,
      activities
    });
  }
  return days;
});

const getCategoryIcon = (category: string) => {
  const map: Record<string, string> = {
    'transport': '✈️',
    'fuel': '⛽',
    'tolls': '🛣️',
    'accommodation': '🏨',
    'food': '🍔',
    'activity': '🎫',
    'other': '📦'
  };
  return map[category] || '💰';
};

const getStopIcon = (type: string) => {
  const map: Record<string, string> = {
    'city': '🏙️',
    'accommodation': '🏨',
    'restaurant': '🍽️',
    'activity': '🎫',
    'poi': '📍'
  };
  return map[type] || '📍';
};

const initMap = () => {
  if (!trip.value || !trip.value.stops) return;
  if (map) {
    updateMapMarkers();
    return;
  }

  const stops = trip.value.stops;
  let initialView: L.LatLngExpression = [46.603354, 1.888334];

  if (stops.length > 0) {
    initialView = [stops[0].latitude, stops[0].longitude];
  }

  map = L.map('trip-map').setView(initialView, 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  updateMapMarkers();
};

let segmentQueue: any[] = [];
let isProcessingQueue = false;
let routeLayers: L.Layer[] = [];
let router: any = null;

const updateMapMarkers = () => {
  if (!map || !trip.value) return;

  markers.forEach(m => map!.removeLayer(m));
  markers = [];

  routeLayers.forEach(l => map!.removeLayer(l));
  routeLayers = [];

  routingControls.forEach(c => {
     if (c.onRemove) c.onRemove(map);
     else map!.removeControl(c);
  });
  routingControls = [];

  estimatedFuelCost.value = 0;
  estimatedTollCost.value = 0;
  segmentQueue = [];
  isProcessingQueue = false;

  const stops = trip.value.stops;

  const stopsByDay: Record<string, Stop[]> = {};
  stops.forEach(s => {
    const day = (s.arrivalDate || '').substring(0, 10);
    if (!stopsByDay[day]) stopsByDay[day] = [];
    stopsByDay[day].push(s);
  });

  let filteredStops: Stop[] = [];
  Object.values(stopsByDay).forEach(dayStops => {
    const activities = dayStops.filter(s => s.type !== 'city');
    if (activities.length > 0) {
      filteredStops.push(...activities);
    } else {
      filteredStops.push(...dayStops);
    }
  });

  filteredStops.sort((a, b) => {
    return (a.arrivalDate || '').localeCompare(b.arrivalDate || '');
  });

  filteredStops.forEach((stop: any) => {
    const marker = L.marker([stop.latitude, stop.longitude])
      .bindPopup(`<b>${stop.title}</b><br>${formatStopType(stop.type)}`)
      .addTo(map!);
    markers.push(marker);
  });

  const routerOptions: any = {
    serviceUrl: 'https://router.project-osrm.org/route/v1',
    profile: 'driving',
    routingOptions: {
      steps: true
    }
  };

  if (routeSettings.value.avoidTolls) {
    routerOptions.routingOptions.exclude = ['toll'];
  }

  router = L.Routing.osrmv1(routerOptions);

  if (filteredStops.length > 1) {
    for (let i = 0; i < filteredStops.length - 1; i++) {
      const start = filteredStops[i];
      const end = filteredStops[i+1];

      const startDate = (start.arrivalDate || '').substring(0, 10);
      const endDate = (end.arrivalDate || '').substring(0, 10);
      const isSameDay = startDate === endDate;

      const color = isSameDay ? '#FF1493' : '#3498db';
      const weight = isSameDay ? 4 : 5;

      segmentQueue.push({
        start: L.latLng(start.latitude, start.longitude),
        end: L.latLng(end.latitude, end.longitude),
        style: {
          color: color,
          weight: weight,
          opacity: 0.8
        }
      });
    }

    processNextSegment();
  } else if (filteredStops.length === 1) {
    map!.setView([filteredStops[0].latitude, filteredStops[0].longitude], 10);
  }
};


const processNextSegment = () => {
  if (segmentQueue.length === 0) {
    isProcessingQueue = false;
    if (markers.length > 0) {
      const group = L.featureGroup([...markers, ...routeLayers]);
      map!.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
    return;
  }

  isProcessingQueue = true;
  const segment = segmentQueue.shift();

  const tempLayer = L.polyline([segment.start, segment.end], segment.style).addTo(map!);
  routeLayers.push(tempLayer);

  router.route([
    { latLng: segment.start },
    { latLng: segment.end }
  ], (err: any, routes: any[]) => {

    if (!err && routes && routes.length > 0) {
      const bestRoute = routes[0];

      if (bestRoute.coordinates && bestRoute.coordinates.length > 0) {
        map!.removeLayer(tempLayer);
        const idx = routeLayers.indexOf(tempLayer);
        if (idx > -1) routeLayers.splice(idx, 1);

        const realLayer = L.polyline(bestRoute.coordinates, segment.style).addTo(map!);
        routeLayers.push(realLayer);

        const dist = bestRoute.summary.totalDistance;
        const distKm = dist / 1000;
        const consumption = routeSettings.value.carConsumption;
        const price = routeSettings.value.fuelPrice;
        estimatedFuelCost.value += (distKm / 100) * consumption * price;

        if (!routeSettings.value.avoidTolls && bestRoute.instructions) {
          let segmentTollDist = 0;
          let hasToll = false;

          bestRoute.instructions.forEach((instr: any) => {
            const text = (instr.text || '').toLowerCase();
            const isToll = instr.road && (text.includes('péage') || text.includes('toll') || instr.type === 'Toll' || instr.toll);

            const isAutoroute = /a\s?\d{1,3}/.test(text) || (instr.road && /A\d+/.test(instr.road));

            if (isToll || (isAutoroute && !text.includes('gratuit'))) {
               segmentTollDist += instr.distance;
               hasToll = true;
            }
          });
          console.groupEnd();

          const tollKm = segmentTollDist / 1000;
          estimatedTollCost.value += tollKm * routeSettings.value.tollRate;
        }
      }
    } else {
      const distMeters = segment.start.distanceTo(segment.end);
      const distKm = (distMeters / 1000) * 1.3;
      const consumption = routeSettings.value.carConsumption;
      const price = routeSettings.value.fuelPrice;
      estimatedFuelCost.value += (distKm / 100) * consumption * price;

      if (!routeSettings.value.avoidTolls) {
           estimatedTollCost.value += (distKm * 0.6) * routeSettings.value.tollRate;
      }
    }
    setTimeout(() => processNextSegment(), 1000);
  }, null, {});
};

const openRouteSettings = () => {
  showRouteSettingsModal.value = true;
};

const saveRouteSettings = async () => {
  if (!trip.value) return;
  isSubmitting.value = true;
  try {
    await api.patch(`/trips/${trip.value.id}`, {
       carConsumption: routeSettings.value.carConsumption,
       fuelPrice: routeSettings.value.fuelPrice,
       tollRate: routeSettings.value.tollRate
    });

    trip.value.carConsumption = routeSettings.value.carConsumption;
    trip.value.fuelPrice = routeSettings.value.fuelPrice;
    (trip.value as any).tollRate = routeSettings.value.tollRate;

    updateMapMarkers();

    showRouteSettingsModal.value = false;
  } catch(e) {
    console.error(e);
    alert("Erreur lors de la sauvegarde des paramètres");
  } finally {
    isSubmitting.value = false;
  }
};

const createExpense = async () => {

  if (!trip.value) return;

  isSubmitting.value = true;

  try {

    await api.post(`/trips/${trip.value.id}/expenses`, {

      tripId: trip.value.id,

      title: newExpense.value.title,

      amount: newExpense.value.amount,

      category: newExpense.value.category,

      paidBy: newExpense.value.paidBy,

      expenseDate: newExpense.value.date

    });



    showExpenseModal.value = false;

    newExpense.value = { title: '', amount: 0, category: 'food', paidBy: currentUser.value?.id || null, date: new Date().toISOString().split('T')[0] };

    await fetchTripDetails();

  } catch (e) {


    console.error(e);
    alert('Erreur lors de la création de la dépense');
  } finally {
    isSubmitting.value = false;
  }
};

const searchLocation = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  if (locationSearch.value.length < 3) {
    searchResults.value = [];
    return;
  }

  searchTimeout = setTimeout(async () => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch.value)}`);
      searchResults.value = await response.json();
    } catch (e) {
      console.error(e);
    }
  }, 500);
};

const selectLocation = (result: any) => {
  newStop.value.title = result.display_name.split(',')[0];
  newStop.value.latitude = parseFloat(result.lat);
  newStop.value.longitude = parseFloat(result.lon);
  locationSearch.value = '';
  searchResults.value = [];
};

const openAddActivityModal = (date: string) => {
  newStop.value = {
    title: '',
    latitude: null,
    longitude: null,
    type: 'activity',
    price: 0,
    paidBy: currentUser.value?.id || null,
    arrivalDate: date,
    departureDate: date
  };
  showStopModal.value = true;
};
const addStop = async () => {
  if (!trip.value) return;
  isSubmitting.value = true;
  try {
    const nextOrder = trip.value.stops.length + 1;

    await api.post(`/trips/${trip.value.id}/stops`, {
      title: newStop.value.title,
      type: newStop.value.type,
      latitude: newStop.value.latitude,
      longitude: newStop.value.longitude,
      arrivalDate: newStop.value.arrivalDate,
      departureDate: newStop.value.departureDate,
      price: newStop.value.price,
      paidBy: newStop.value.paidBy,
      order: nextOrder,
      isLocked: false,
      address: newStop.value.title
    });

    showStopModal.value = false;
    await fetchTripDetails();
  } catch (e) {
    console.error(e);
    alert('Erreur lors de l\'ajout de l\'activité');
  } finally {
    isSubmitting.value = false;
  }
};

const inviteParticipant = async () => {
  if (!trip.value) return;
  isSubmitting.value = true;
  try {
    await api.post(`/trips/${trip.value.id}/participants`, {
      email: inviteEmail.value
    });

    showInviteModal.value = false;
    inviteEmail.value = '';
    alert('Invitation envoyée !');
    await fetchTripDetails();
  } catch (e: any) {
    console.error(e);
    alert(e.response?.data?.message || 'Erreur lors de l\'invitation');
  } finally {
    isSubmitting.value = false;
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });
};

const formatDateRange = (start: string, end: string) => {
  return `${new Date(start).toLocaleDateString('fr-FR')} - ${new Date(end).toLocaleDateString('fr-FR')}`;
}

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    'planning': 'En planification',
    'active': 'En cours',
    'completed': 'Terminé',
    'cancelled': 'Annulé'
  };
  return map[status] || status;
};

const formatStopType = (type: string) => {
  const map: Record<string, string> = {
    'poi': '📍 Point d\'intérêt',
    'accommodation': '🏨 Hébergement',
    'restaurant': '🍴 Restauration',
    'activity': '🎟️ Activité',
    'city': '🏙️ Ville étape'
  };
  return map[type] || type;
};

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    const first = parts[0]?.[0] || '';
    const last = parts[parts.length-1]?.[0] || '';
    return (first + last).toUpperCase();
  }
  return parts[0]?.substring(0, 2).toUpperCase() || '?';
};

onMounted(async () => {
  try {
    currentUser.value = await getMe();
  } catch(e) {
    console.error("Failed to load user", e);
  }
  fetchTripDetails();
});
</script>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.loading-container, .error-container {
  text-align: center;
  padding: 50px;
  font-size: 1.2rem;
  color: #7f8c8d;
}

.error-container {
  color: #e74c3c;
}

.trip-header {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-content h1 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.dates-badge {
  display: inline-block;
  background: #f0f2f5;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 10px;
}

.description {
  color: #7f8c8d;
  margin: 0;
  max-width: 600px;
}

.trip-meta {
  display: flex;
  gap: 15px;
  align-items: center;
}

.status-box {
  padding: 8px 15px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
}
.status-box.planning { background: #fff3e0; color: #f57c00; }
.status-box.active { background: #e8f5e9; color: #2e7d32; }

/* Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 20px;
  height: calc(100vh - 200px); /* Fill remaining height */
}

@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    height: auto;
  }
}

/* Section Card */
.section-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 10px;
}

.section-header h2 {
  font-size: 1.1rem;
  margin: 0;
  color: #34495e;
}

.btn-small {
  background: #f0f2f5;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  color: #555;
  transition: background 0.3s;
}

.btn-small:hover {
  background: #e0e0e0;
}

/* Budget Section */
.budget-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
}

.budget-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.budget-item .label {
  font-size: 0.75rem;
  color: #7f8c8d;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 4px;
}

.budget-item .value {
  font-size: 1.1rem;
  font-weight: bold;
  color: #2c3e50;
}

.budget-item.expenses .value {
  color: #e67e22;
}

.budget-item.remaining .value {
  color: #27ae60;
}

.budget-item.remaining.negative .value {
  color: #c0392b;
}

.expenses-list h3 {
  font-size: 0.9rem;
  color: #95a5a6;
  margin-bottom: 10px;
  font-weight: 600;
}

.expense-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.expense-item.clickable {
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  transition: background 0.2s;
}

.expense-item.clickable:hover {
  background: #f0f2f5;
}

.expense-icon {
  width: 32px;
  height: 32px;
  background: #f0f2f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.expense-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.expense-title {
  font-weight: 500;
  font-size: 0.9rem;
}

.expense-payer {
  font-size: 0.75rem;
  color: #95a5a6;
}

.expense-amount {
  font-weight: 600;
  color: #e74c3c;
}

.btn-link {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  margin-top: 10px;
  text-decoration: underline;
}

/* Day by Day Itinerary */
.days-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.day-group {
  border-left: 2px solid #3498db;
  padding-left: 20px;
  position: relative;
}

.day-group::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 0;
  width: 10px;
  height: 10px;
  background: #3498db;
  border-radius: 50%;
}

.day-header {
  margin-bottom: 10px;
}

.day-date {
  display: flex;
  gap: 10px;
  align-items: baseline;
}

.day-number {
  font-weight: bold;
  color: #3498db;
  text-transform: uppercase;
  font-size: 0.85rem;
}

.day-date-text {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.day-city {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-top: 5px;
}

.day-activities {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 10px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  margin-bottom: 8px;
  border: 1px solid #eee;
}

.activity-icon {
  font-size: 1.2rem;
}

.activity-info {
  display: flex;
  flex-direction: column;
}

.activity-title {
  font-weight: 500;
  font-size: 0.9rem;
}

.activity-type {
  font-size: 0.75rem;
  color: #95a5a6;
}

.btn-add-activity {
  width: 100%;
  padding: 8px;
  background: white;
  border: 1px dashed #ccc;
  color: #7f8c8d;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-add-activity:hover {
  background: #f0f2f5;
  border-color: #bbb;
  color: #555;
}

/* Participants */
.participant-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.avatar {
  width: 32px;
  height: 32px;
  background: #3498db;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
}

.participant-info {
  display: flex;
  flex-direction: column;
}

.participant-info .name {
  font-size: 0.9rem;
  font-weight: 500;
}

.participant-info .email {
  font-size: 0.75rem;
  color: #7f8c8d;
}

/* Map Column */
.map-column {
  height: 100%;
}

.map-wrapper {
  height: 100%;
  min-height: 400px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid #ddd;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  text-align: center;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #34495e;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 25px;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary {
  background: #ecf0f1;
  color: #2c3e50;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.search-input-wrapper {
  position: relative;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 0 0 6px 6px;
  max-height: 150px;
  overflow-y: auto;
  z-index: 1100;
  list-style: none;
  padding: 0;
  margin: 0;
}

.search-results li {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.search-results li:hover {
  background: #f8f9fa;
}

.selected-location {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 0.9rem;
}

.map-header-overlay {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 999;
  background: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}
.map-header-overlay h2 {
  display: none; /* Hidden title */
}
.map-column {
  position: relative; /* For absolute overlay */
}

.fuel-estimation {
  margin-top: 15px;
  padding: 10px;
  background: #fff3e0;
  border-left: 4px solid #f39c12;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.toll-estimation {
  background: #e3f2fd;
  border-left-color: #3498db;
  margin-top: 10px;
}
.fuel-text {
  color: #d35400;
}
.fuel-estimation small {
  color: #7f8c8d;
}
.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: normal;
  cursor: pointer;
}
.checkbox-group input {
  width: auto;
}
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  font-size: 1rem;
  transition: background 0.2s;
  opacity: 0.6;
}
.btn-icon:hover {
  background: #fee;
  opacity: 1;
}
.btn-icon.delete {
  color: #e74c3c;
}
.btn-icon.leave {
  color: #3498db;
}
.btn-icon.leave:hover {
  background: #ebf5fb;
}
</style>

<template>
  <div v-if="loading" class="trip-dashboard__loading">
    <i class="fi fi-rr-road"></i>
    Chargement du voyage...
  </div>

  <div v-else-if="error" class="trip-dashboard__error">
    <i class="fi fi-rr-exclamation"></i>
    {{ error }}
  </div>

  <div v-else class="trip-dashboard">
    <div class="trip-dashboard__container">
      <header class="trip-dashboard__header">
        <div class="trip-dashboard__header-content">
          <h1 class="trip-dashboard__title">{{ trip.title }}</h1>
          <div class="trip-dashboard__dates">
            <i class="fi fi-rr-calendar"></i>
            {{ formatDateRange(trip.startDate, trip.endDate) }}
          </div>
        </div>
        <div class="trip-dashboard__header-right">
          <div class="trip-dashboard__participants-avatars" @click="showParticipantsModal = true">
            <div
              v-for="(participant, index) in trip.participants.slice(0, 4)"
              :key="participant.id"
              class="trip-dashboard__avatar"
              :style="{ zIndex: 10 - index }"
              :title="participant.fullName"
            >
              {{ getInitials(participant.fullName) }}
            </div>
            <div v-if="trip.participants.length > 4"
                 class="trip-dashboard__avatar trip-dashboard__avatar--more">
              +{{ trip.participants.length - 4 }}
            </div>
            <button class="trip-dashboard__avatar trip-dashboard__avatar--add">
              <i class="fi fi-rr-plus"></i>
            </button>
          </div>
          <span
            class="trip-dashboard__status-badge"
            :class="`trip-dashboard__status-badge--${trip.status}`"
          >
            <i :class="getStatusIcon(trip.status)"></i>
            {{ formatStatus(trip.status) }}
          </span>
        </div>
      </header>

      <div class="trip-dashboard__grid">
        <div class="trip-dashboard__col-budget">
          <section class="trip-dashboard__card trip-dashboard__card--delay-1"
                   :class="{ 'trip-dashboard__card--collapsed': !budgetExpanded, 'trip-dashboard__card--expanded': budgetExpanded }">
            <div class="trip-dashboard__card-header">
              <h2 class="trip-dashboard__card-title">
                <i class="fi fi-rr-wallet"></i>
                Dépenses
              </h2>
              <button
                class="trip-dashboard__btn trip-dashboard__btn--primary trip-dashboard__btn--small"
                @click="showExpenseModal = true">
                <i class="fi fi-rr-plus"></i>
                Dépense
              </button>
            </div>

            <div class="trip-dashboard__card-content">
              <div class="trip-dashboard__budget-grid">
                <div class="trip-dashboard__budget-item">
                  <div class="trip-dashboard__budget-label">Budget Total</div>
                  <div class="trip-dashboard__budget-value">{{ trip.budget }} €</div>
                </div>
                <div class="trip-dashboard__budget-item trip-dashboard__budget-item--expenses">
                  <div class="trip-dashboard__budget-label">Dépensé</div>
                  <div class="trip-dashboard__budget-value">{{ totalExpenses }} €</div>
                </div>
                <div
                  class="trip-dashboard__budget-item trip-dashboard__budget-item--remaining"
                  :class="{ 'trip-dashboard__budget-item--negative': remainingBudget < 0 }"
                >
                  <div class="trip-dashboard__budget-label">Reste</div>
                  <div class="trip-dashboard__budget-value">{{ remainingBudget }} €</div>
                </div>
              </div>

              <div v-if="estimatedFuelCost > 0"
                   class="trip-dashboard__estimate trip-dashboard__estimate--fuel">
                <div class="trip-dashboard__estimate-icon">
                  <i class="fi fi-rr-gas-pump"></i>
                </div>
                <div class="trip-dashboard__estimate-content">
                  <p class="trip-dashboard__estimate-text">
                    Coût essence estimé : <strong>{{ estimatedFuelCost.toFixed(2) }} €</strong>
                  </p>
                  <p class="trip-dashboard__estimate-detail">({{ trip?.carConsumption }}L/100km à
                    {{ trip?.fuelPrice }}€/L)</p>
                </div>
              </div>

              <div v-if="!routeSettings.avoidTolls"
                   class="trip-dashboard__estimate trip-dashboard__estimate--toll">
                <div class="trip-dashboard__estimate-icon">
                  <i class="fi fi-rr-road"></i>
                </div>
                <div class="trip-dashboard__estimate-content">
                  <p class="trip-dashboard__estimate-text">
                    Coût péage estimé : <strong>{{ estimatedTollCost.toFixed(2) }} €</strong>
                  </p>
                  <p class="trip-dashboard__estimate-detail">(Moyenne {{
                      routeSettings.tollRate
                    }}€/km)</p>
                </div>
              </div>

              <div v-if="trip.expenses && trip.expenses.length > 0">
                <h3 class="trip-dashboard__expenses-header">Dernières dépenses</h3>
                <div
                  v-for="expense in trip.expenses.slice(0, 4)"
                  :key="expense.id"
                  class="trip-dashboard__expense-item"
                  @click="openEditExpenseModal(expense)"
                >
                  <div class="trip-dashboard__expense-icon"
                       :class="`trip-dashboard__expense-icon--${expense.category}`">
                    <i :class="getCategoryIconClass(expense.category)"></i>
                  </div>
                  <div class="trip-dashboard__expense-details">
                    <p class="trip-dashboard__expense-title">{{ expense.title }}</p>
                    <p class="trip-dashboard__expense-payer">Payé par
                      {{ expense.payer?.fullName || '?' }}</p>
                  </div>
                  <span class="trip-dashboard__expense-amount">-{{ expense.amount }} €</span>
                  <button class="trip-dashboard__expense-delete"
                          @click.stop="openDeleteModal('expense', expense)">
                    <i class="fi fi-rr-trash"></i>
                  </button>
                </div>
                <button v-if="trip.expenses.length > 4" class="trip-dashboard__view-all">
                  Voir tout ({{ trip.expenses.length }})
                </button>
              </div>
              <div v-else class="trip-dashboard__empty">
                <i class="fi fi-rr-receipt"></i>
                Aucune dépense enregistrée.
              </div>
            </div>

            <button
              class="trip-dashboard__expand-btn"
              :class="{ 'trip-dashboard__expand-btn--expanded': budgetExpanded }"
              @click="budgetExpanded = !budgetExpanded"
            >
              <span>{{ budgetExpanded ? 'Réduire' : 'Voir plus' }}</span>
              <i class="fi fi-rr-angle-small-down"></i>
            </button>
          </section>
        </div>

        <div class="trip-dashboard__col-itinerary">
          <section class="trip-dashboard__card trip-dashboard__card--delay-2"
                   :class="{ 'trip-dashboard__card--collapsed': !itineraryExpanded, 'trip-dashboard__card--expanded': itineraryExpanded }">
            <div class="trip-dashboard__card-header">
              <h2 class="trip-dashboard__card-title">
                <i class="fi fi-rr-marker"></i>
                Itinéraire
              </h2>
            </div>

            <div class="trip-dashboard__day-nav">
              <button
                class="trip-dashboard__day-nav-btn"
                :disabled="currentDayIndex === 0"
                @click="currentDayIndex--"
              >
                <i class="fi fi-rr-angle-left"></i>
              </button>
              <span class="trip-dashboard__day-nav-label">
                Jour {{ currentDayIndex + 1 }} / {{ itineraryByDay.length }}
              </span>
              <button
                class="trip-dashboard__day-nav-btn"
                :disabled="currentDayIndex >= itineraryByDay.length - 1"
                @click="currentDayIndex++"
              >
                <i class="fi fi-rr-angle-right"></i>
              </button>
            </div>

            <div class="trip-dashboard__itinerary-scroll">
              <div class="trip-dashboard__days">
                <div
                  v-for="(day, index) in itineraryByDay"
                  :key="index"
                  class="trip-dashboard__day"
                  :class="{ 'trip-dashboard__day--active': index === currentDayIndex }"
                >
                  <div class="trip-dashboard__day-header">
                    <div class="trip-dashboard__day-date">
                      <span class="trip-dashboard__day-number">Jour {{ index + 1 }}</span>
                      <span class="trip-dashboard__day-date-text">{{ formatDate(day.date) }}</span>
                    </div>
                    <div class="trip-dashboard__day-city">
                      <i class="fi fi-rr-map-marker"></i>
                      {{ day.city ? day.city.title : 'Aucune étape' }}
                    </div>
                  </div>

                  <div class="trip-dashboard__day-activities">
                    <div
                      v-for="activity in day.activities"
                      :key="activity.id"
                      class="trip-dashboard__activity-item"
                    >
                      <div class="trip-dashboard__activity-icon">
                        <i :class="getStopIconClass(activity.type)"></i>
                      </div>
                      <div class="trip-dashboard__activity-info">
                        <p class="trip-dashboard__activity-title">{{ activity.title }}</p>
                        <p class="trip-dashboard__activity-type">{{
                            formatStopType(activity.type)
                          }}</p>
                      </div>
                      <button class="trip-dashboard__activity-delete"
                              @click="openDeleteModal('stop', activity)">
                        <i class="fi fi-rr-trash"></i>
                      </button>
                    </div>
                    <button class="trip-dashboard__add-activity"
                            @click="openAddActivityModal(day.date)">
                      <i class="fi fi-rr-plus"></i>
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              class="trip-dashboard__expand-btn"
              :class="{ 'trip-dashboard__expand-btn--expanded': itineraryExpanded }"
              @click="itineraryExpanded = !itineraryExpanded"
            >
              <span>{{ itineraryExpanded ? 'Réduire' : 'Voir plus' }}</span>
              <i class="fi fi-rr-angle-small-down"></i>
            </button>
          </section>
        </div>

        <div class="trip-dashboard__col-map">
          <div class="trip-dashboard__map-card">
            <div class="trip-dashboard__map-header">
              <button
                class="trip-dashboard__btn trip-dashboard__btn--secondary trip-dashboard__btn--small"
                @click="openRouteSettings">
                <i class="fi fi-rr-settings"></i>
                Options Trajet
              </button>
            </div>
            <div class="trip-dashboard__map-wrapper" id="trip-map"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="showRouteSettingsModal" class="trip-dashboard__modal-overlay"
         @click.self="showRouteSettingsModal = false">
      <div class="trip-dashboard__modal">
        <h3 class="trip-dashboard__modal-title">
          <i class="fi fi-rr-settings"></i>
          Options d'Itinéraire
        </h3>
        <form @submit.prevent="saveRouteSettings">
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">Consommation (L/100km)</label>
            <input type="number" step="0.1" v-model="routeSettings.carConsumption" required
                   class="trip-dashboard__input"/>
          </div>
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">Prix Carburant (€/L)</label>
            <input type="number" step="0.01" v-model="routeSettings.fuelPrice" required
                   class="trip-dashboard__input"/>
          </div>
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">Coût Péage (€/km)</label>
            <input type="number" step="0.01" v-model="routeSettings.tollRate" required
                   class="trip-dashboard__input"/>
            <p class="trip-dashboard__form-hint">Moyenne France : 0.12€/km</p>
          </div>
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">Préférence</label>
            <select v-model="routeSettings.routingPreference" class="trip-dashboard__select">
              <option value="fastest">Le plus rapide</option>
              <option value="shortest">Le plus court</option>
            </select>
          </div>
          <div class="trip-dashboard__form-group">
            <div class="trip-dashboard__checkbox-group">
              <input type="checkbox" id="avoidTolls" v-model="routeSettings.avoidTolls"/>
              <label for="avoidTolls">Éviter les péages</label>
            </div>
          </div>
          <div class="trip-dashboard__modal-actions">
            <button type="button" class="trip-dashboard__btn trip-dashboard__btn--secondary"
                    @click="showRouteSettingsModal = false">Annuler
            </button>
            <button type="submit" class="trip-dashboard__btn trip-dashboard__btn--primary"
                    :disabled="isSubmitting">
              <i class="fi fi-rr-check"></i>
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showEditExpenseModal" class="trip-dashboard__modal-overlay"
         @click.self="showEditExpenseModal = false">
      <div class="trip-dashboard__modal">
        <h3 class="trip-dashboard__modal-title">
          <i class="fi fi-rr-edit"></i>
          Modifier la dépense
        </h3>
        <form @submit.prevent="updateExpense">
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">Titre</label>
            <input v-model="editingExpense.title" required class="trip-dashboard__input"/>
          </div>
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">Montant (€)</label>
            <input type="number" v-model="editingExpense.amount" required min="0" step="0.01"
                   class="trip-dashboard__input"/>
          </div>
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">Payé par</label>
            <select v-model="editingExpense.paidBy" required class="trip-dashboard__select">
              <option v-for="p in trip.participants" :key="p.id" :value="p.id">
                {{ p.id === currentUser?.id ? 'Moi' : p.fullName }}
              </option>
            </select>
          </div>
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">Catégorie</label>
            <select v-model="editingExpense.category" required class="trip-dashboard__select">
              <option value="fuel">Essence</option>
              <option value="tolls">Péage</option>
              <option value="food">Nourriture</option>
              <option value="accommodation">Logement</option>
              <option value="activity">Activité</option>
              <option value="transport">Transport</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">Date</label>
            <input type="date" v-model="editingExpense.expenseDate" required
                   class="trip-dashboard__input"/>
          </div>
          <div class="trip-dashboard__modal-actions">
            <button type="button" class="trip-dashboard__btn trip-dashboard__btn--secondary"
                    @click="showEditExpenseModal = false">Annuler
            </button>
            <button type="submit" class="trip-dashboard__btn trip-dashboard__btn--primary"
                    :disabled="isSubmitting">
              <i class="fi fi-rr-check"></i>
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showExpenseModal" class="trip-dashboard__modal-overlay"
         @click.self="showExpenseModal = false">
      <div class="trip-dashboard__modal">
        <h3 class="trip-dashboard__modal-title">
          <i class="fi fi-rr-receipt"></i>
          Ajouter une dépense
        </h3>
        <form @submit.prevent="createExpense">
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">Titre</label>
            <input v-model="newExpense.title" required placeholder="Ex: Plein d'essence"
                   class="trip-dashboard__input"/>
          </div>
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">Montant (€)</label>
            <input type="number" v-model="newExpense.amount" required min="0" step="0.01"
                   class="trip-dashboard__input"/>
          </div>
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">Payé par</label>
            <select v-model="newExpense.paidBy" required class="trip-dashboard__select">
              <option v-for="p in trip.participants" :key="p.id" :value="p.id">
                {{ p.id === currentUser?.id ? 'Moi' : p.fullName }}
              </option>
            </select>
          </div>
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">Catégorie</label>
            <select v-model="newExpense.category" required class="trip-dashboard__select">
              <option value="fuel">Essence</option>
              <option value="tolls">Péage</option>
              <option value="food">Nourriture</option>
              <option value="accommodation">Logement</option>
              <option value="activity">Activité</option>
              <option value="transport">Transport</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">Date</label>
            <input type="date" v-model="newExpense.date" required class="trip-dashboard__input"/>
          </div>
          <div class="trip-dashboard__modal-actions">
            <button type="button" class="trip-dashboard__btn trip-dashboard__btn--secondary"
                    @click="showExpenseModal = false">Annuler
            </button>
            <button type="submit" class="trip-dashboard__btn trip-dashboard__btn--primary"
                    :disabled="isSubmitting">
              <i class="fi fi-rr-plus"></i>
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showStopModal" class="trip-dashboard__modal-overlay"
         @click.self="showStopModal = false">
      <div class="trip-dashboard__modal trip-dashboard__modal--activity">
        <button class="trip-dashboard__modal-close" @click="showStopModal = false">
          <i class="fi fi-rr-cross-small"></i>
        </button>

        <div class="trip-dashboard__modal-header-icon">
          <i class="fi fi-rr-marker"></i>
        </div>
        <h3 class="trip-dashboard__modal-title">Ajouter une activité</h3>
        <div class="trip-dashboard__modal-date">
          <i class="fi fi-rr-calendar"></i>
          {{ formatDate(newStop.arrivalDate) }}
        </div>

        <div v-if="!newStop.latitude" class="trip-dashboard__activity-search">
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">
              Rechercher un lieu
            </label>
            <div class="trip-dashboard__search-wrapper">
              <input
                type="text"
                v-model="locationSearch"
                @input="searchLocation"
                placeholder="Restaurant, Musée, Activité..."
                class="trip-dashboard__input trip-dashboard__input--search"
              />
              <div v-if="isSearching" class="trip-dashboard__search-spinner">
                <i class="fi fi-rr-spinner trip-dashboard__spinner"></i>
              </div>
            </div>

            <ul v-if="searchResults.length > 0" class="trip-dashboard__search-results-activity">
              <li v-for="result in searchResults.slice(0, 5)" :key="result.place_id"
                  @click="selectLocation(result)" class="trip-dashboard__search-result-item">
                <div class="trip-dashboard__search-result-icon">
                  <i class="fi fi-rr-marker"></i>
                </div>
                <div class="trip-dashboard__search-result-info">
                  <span class="trip-dashboard__search-result-name">{{ result.display_name.split(',')[0] }}</span>
                  <span class="trip-dashboard__search-result-address">{{ result.display_name.split(',').slice(1, 3).join(',') }}</span>
                </div>
              </li>
            </ul>

            <div v-if="locationSearch.length >= 3 && !isSearching && searchResults.length === 0" class="trip-dashboard__search-empty">
              <i class="fi fi-rr-search-alt"></i>
              <p>Aucun résultat trouvé</p>
            </div>

            <p v-if="locationSearch.length < 3 && !newStop.latitude" class="trip-dashboard__search-hint">
              <i class="fi fi-rr-info"></i>
              Tapez au moins 3 caractères pour rechercher
            </p>
          </div>
        </div>

        <form v-if="newStop.latitude" @submit.prevent="addStop" class="trip-dashboard__activity-form">
          <div class="trip-dashboard__selected-location">
            <i class="fi fi-rr-check-circle"></i>
            <span>{{ newStop.title }}</span>
            <button type="button" class="trip-dashboard__change-location" @click="newStop.latitude = null; newStop.longitude = null; newStop.title = '';">
              <i class="fi fi-rr-pencil"></i>
            </button>
          </div>

          <div class="trip-dashboard__form-row">
            <div class="trip-dashboard__form-group trip-dashboard__form-group--flex">
              <label class="trip-dashboard__label">
                <i class="fi fi-rr-apps"></i>
                Type
              </label>
              <select v-model="newStop.type" required class="trip-dashboard__select">
                <option value="accommodation">🏨 Hébergement</option>
                <option value="restaurant">🍴 Restauration</option>
                <option value="activity">🎟️ Activité</option>
                <option value="poi">📍 Point d'intérêt</option>
              </select>
            </div>

            <div class="trip-dashboard__form-group trip-dashboard__form-group--flex">
              <label class="trip-dashboard__label">
                <i class="fi fi-rr-euro"></i>
                Prix estimé
              </label>
              <input type="number" v-model="newStop.price" min="0" step="0.01" placeholder="0.00"
                     class="trip-dashboard__input"/>
            </div>
          </div>

          <div class="trip-dashboard__form-group" v-if="newStop.price > 0">
            <label class="trip-dashboard__label">
              <i class="fi fi-rr-user"></i>
              Payé par
            </label>
            <select v-model="newStop.paidBy" class="trip-dashboard__select">
              <option v-for="p in trip.participants" :key="p.id" :value="p.id">
                {{ p.id === currentUser?.id ? 'Moi' : p.fullName }}
              </option>
            </select>
          </div>

          <div class="trip-dashboard__modal-actions">
            <button type="button" class="trip-dashboard__btn trip-dashboard__btn--secondary"
                    @click="showStopModal = false">
              Annuler
            </button>
            <button type="submit" class="trip-dashboard__btn trip-dashboard__btn--primary"
                    :disabled="isSubmitting">
              <i v-if="isSubmitting" class="fi fi-rr-spinner trip-dashboard__spinner"></i>
              <i v-else class="fi fi-rr-check"></i>
              {{ isSubmitting ? 'Ajout...' : 'Ajouter' }}
            </button>
          </div>
        </form>

        <div v-if="!newStop.latitude" class="trip-dashboard__modal-actions trip-dashboard__modal-actions--center">
          <button type="button" class="trip-dashboard__btn trip-dashboard__btn--secondary"
                  @click="showStopModal = false">
            Annuler
          </button>
        </div>
      </div>
    </div>

    <div v-if="showInviteModal" class="trip-dashboard__modal-overlay"
         @click.self="showInviteModal = false">
      <div class="trip-dashboard__modal">
        <h3 class="trip-dashboard__modal-title">
          <i class="fi fi-rr-envelope"></i>
          Inviter un participant
        </h3>
        <form @submit.prevent="inviteParticipant">
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">Email</label>
            <input type="email" v-model="inviteEmail" required placeholder="ami@exemple.com"
                   class="trip-dashboard__input"/>
          </div>
          <div class="trip-dashboard__modal-actions">
            <button type="button" class="trip-dashboard__btn trip-dashboard__btn--secondary"
                    @click="showInviteModal = false">Annuler
            </button>
            <button type="submit" class="trip-dashboard__btn trip-dashboard__btn--primary"
                    :disabled="isSubmitting">
              <i class="fi fi-rr-paper-plane"></i>
              Inviter
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showParticipantsModal" class="trip-dashboard__modal-overlay"
         @click.self="showParticipantsModal = false">
      <div class="trip-dashboard__modal">
        <h3 class="trip-dashboard__modal-title">
          <i class="fi fi-rr-users"></i>
          Participants
        </h3>
        <div class="trip-dashboard__participants-list">
          <div v-for="participant in trip.participants" :key="participant.id"
               class="trip-dashboard__participant-row">
            <div class="trip-dashboard__participant-avatar">{{
                getInitials(participant.fullName)
              }}
            </div>
            <div class="trip-dashboard__participant-info">
              <p class="trip-dashboard__participant-name">{{ participant.fullName }}</p>
            </div>
            <button
              v-if="getParticipantAction(participant)"
              class="trip-dashboard__participant-remove"
              @click="openDeleteModal('participant', participant)"
            >
              <i
                :class="getParticipantAction(participant) === 'leave' ? 'fi fi-rr-sign-out-alt' : 'fi fi-rr-trash'"></i>
            </button>
          </div>
        </div>
        <div class="trip-dashboard__modal-actions">
          <button type="button" class="trip-dashboard__btn trip-dashboard__btn--secondary"
                  @click="showParticipantsModal = false">Fermer
          </button>
          <button type="button" class="trip-dashboard__btn trip-dashboard__btn--primary"
                  @click="showParticipantsModal = false; showInviteModal = true">
            <i class="fi fi-rr-user-add"></i>
            Inviter
          </button>
        </div>
      </div>
    </div>

    <AppModal
      v-model="showDeleteConfirmModal"
      type="danger"
      :title="itemToDelete?.action === 'leave' ? 'Quitter le voyage' : `Supprimer`"
      :message="itemToDelete?.action === 'leave' ? 'Êtes-vous sûr de vouloir quitter ce voyage ?' : `Êtes-vous sûr de vouloir supprimer '${itemToDelete?.name}' ?`"
      :confirm-text="itemToDelete?.action === 'leave' ? 'Quitter' : 'Supprimer'"
      cancel-text="Annuler"
      @confirm="confirmDeleteItem"
    />
  </Teleport>
</template>

<script setup lang="ts">
import {ref, onMounted, nextTick, computed} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import api from '../services/api';
import {getMe} from '../services/authService';
import type {Trip, Stop} from '../types/trip';
import type {User} from '../types/user';
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

const budgetExpanded = ref(false);
const itineraryExpanded = ref(false);
const currentDayIndex = ref(0);

const showExpenseModal = ref(false);
const showStopModal = ref(false);
const showInviteModal = ref(false);
const showRouteSettingsModal = ref(false);
const showDeleteConfirmModal = ref(false);
const showEditExpenseModal = ref(false);
const showParticipantsModal = ref(false);
const isSubmitting = ref(false);

const itemToDelete = ref<{
  type: 'expense' | 'stop' | 'participant';
  id: number;
  name: string;
  extraId?: number;
  action?: string
} | null>(null);
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
  if (isCreator) return isMe ? null : 'remove';
  return isMe ? 'leave' : null;
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
      itemToDelete.value = {type, id, name, extraId, action: 'leave'};
      showDeleteConfirmModal.value = true;
      return;
    }
  }
  itemToDelete.value = {type, id, name, extraId};
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
const isSearching = ref(false);
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
    const stopsForDay = trip.value.stops.filter(s => s.arrivalDate && s.arrivalDate.substring(0, 10) === currentDateStr);
    const city = stopsForDay.find(s => s.type === 'city') || null;
    const activities = stopsForDay.filter(s => s.type !== 'city');
    days.push({date: currentDateStr, city, activities});
  }
  return days;
});

const getCategoryIconClass = (category: string): string => {
  const iconMap: Record<string, string> = {
    'transport': 'fi fi-rr-plane',
    'fuel': 'fi fi-rr-gas-pump',
    'tolls': 'fi fi-rr-road',
    'accommodation': 'fi fi-rr-bed',
    'food': 'fi fi-rr-restaurant',
    'activity': 'fi fi-rr-ticket',
    'other': 'fi fi-rr-box'
  };
  return iconMap[category] || 'fi fi-rr-coins';
};

const getStopIconClass = (type: string): string => {
  const iconMap: Record<string, string> = {
    'city': 'fi fi-rr-building',
    'accommodation': 'fi fi-rr-bed',
    'restaurant': 'fi fi-rr-restaurant',
    'activity': 'fi fi-rr-ticket',
    'poi': 'fi fi-rr-marker'
  };
  return iconMap[type] || 'fi fi-rr-marker';
};

const getStatusIcon = (status: string): string => {
  const iconMap: Record<string, string> = {
    'planning': 'fi fi-rr-time-quarter-past',
    'active': 'fi fi-rr-rocket-lunch',
    'completed': 'fi fi-rr-check-circle',
    'cancelled': 'fi fi-rr-ban'
  };
  return iconMap[status] || 'fi fi-rr-circle';
};

const initMap = () => {
  if (!trip.value || !trip.value.stops) return;
  if (map) {
    updateMapMarkers();
    return;
  }
  const stops = trip.value.stops;
  let initialView: L.LatLngExpression = [46.603354, 1.888334];
  if (stops.length > 0) initialView = [stops[0].latitude, stops[0].longitude];
  map = L.map('trip-map').setView(initialView, 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
    if (c.onRemove) c.onRemove(map); else map!.removeControl(c);
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
    if (activities.length > 0) filteredStops.push(...activities);
    else filteredStops.push(...dayStops);
  });
  filteredStops.sort((a, b) => (a.arrivalDate || '').localeCompare(b.arrivalDate || ''));
  filteredStops.forEach((stop: any) => {
    const marker = L.marker([stop.latitude, stop.longitude])
      .bindPopup(`<b>${stop.title}</b><br>${formatStopType(stop.type)}`)
      .addTo(map!);
    markers.push(marker);
  });
  const routerOptions: any = {
    serviceUrl: 'https://router.project-osrm.org/route/v1',
    profile: 'driving',
    routingOptions: {steps: true}
  };
  if (routeSettings.value.avoidTolls) routerOptions.routingOptions.exclude = ['toll'];
  router = L.Routing.osrmv1(routerOptions);
  if (filteredStops.length > 1) {
    for (let i = 0; i < filteredStops.length - 1; i++) {
      const start = filteredStops[i];
      const end = filteredStops[i + 1];
      const startDate = (start.arrivalDate || '').substring(0, 10);
      const endDate = (end.arrivalDate || '').substring(0, 10);
      const isSameDay = startDate === endDate;
      const color = isSameDay ? '#ec4899' : '#1e4d3d';
      const weight = isSameDay ? 3 : 4;
      segmentQueue.push({
        start: L.latLng(start.latitude, start.longitude),
        end: L.latLng(end.latitude, end.longitude),
        style: {color, weight, opacity: 0.8}
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
      map!.fitBounds(group.getBounds(), {padding: [50, 50]});
    }
    return;
  }
  isProcessingQueue = true;
  const segment = segmentQueue.shift();
  const tempLayer = L.polyline([segment.start, segment.end], segment.style).addTo(map!);
  routeLayers.push(tempLayer);
  router.route([{latLng: segment.start}, {latLng: segment.end}], (err: any, routes: any[]) => {
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
        estimatedFuelCost.value += (distKm / 100) * routeSettings.value.carConsumption * routeSettings.value.fuelPrice;
        if (!routeSettings.value.avoidTolls && bestRoute.instructions) {
          let segmentTollDist = 0;
          bestRoute.instructions.forEach((instr: any) => {
            const text = (instr.text || '').toLowerCase();
            const isToll = instr.road && (text.includes('péage') || text.includes('toll') || instr.type === 'Toll' || instr.toll);
            const isAutoroute = /a\s?\d{1,3}/.test(text) || (instr.road && /A\d+/.test(instr.road));
            if (isToll || (isAutoroute && !text.includes('gratuit'))) segmentTollDist += instr.distance;
          });
          estimatedTollCost.value += (segmentTollDist / 1000) * routeSettings.value.tollRate;
        }
      }
    } else {
      const distMeters = segment.start.distanceTo(segment.end);
      const distKm = (distMeters / 1000) * 1.3;
      estimatedFuelCost.value += (distKm / 100) * routeSettings.value.carConsumption * routeSettings.value.fuelPrice;
      if (!routeSettings.value.avoidTolls) estimatedTollCost.value += (distKm * 0.6) * routeSettings.value.tollRate;
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
  } catch (e) {
    console.error(e);
    alert("Erreur lors de la sauvegarde");
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
    newExpense.value = {
      title: '',
      amount: 0,
      category: 'food',
      paidBy: currentUser.value?.id || null,
      date: new Date().toISOString().split('T')[0]
    };
    await fetchTripDetails();
  } catch (e) {
    console.error(e);
    alert('Erreur lors de la création');
  } finally {
    isSubmitting.value = false;
  }
};

const searchLocation = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  if (locationSearch.value.length < 3) {
    searchResults.value = [];
    isSearching.value = false;
    return;
  }
  isSearching.value = true;
  searchTimeout = setTimeout(async () => {
    try {
      searchResults.value = await (await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch.value)}`)).json();
    } catch (e) {
      console.error(e);
    } finally {
      isSearching.value = false;
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
    await api.post(`/trips/${trip.value.id}/stops`, {
      title: newStop.value.title,
      type: newStop.value.type,
      latitude: newStop.value.latitude,
      longitude: newStop.value.longitude,
      arrivalDate: newStop.value.arrivalDate,
      departureDate: newStop.value.departureDate,
      price: newStop.value.price,
      paidBy: newStop.value.paidBy,
      order: trip.value.stops.length + 1,
      isLocked: false,
      address: newStop.value.title
    });
    showStopModal.value = false;
    await fetchTripDetails();
  } catch (e) {
    console.error(e);
    alert('Erreur lors de l\'ajout');
  } finally {
    isSubmitting.value = false;
  }
};

const inviteParticipant = async () => {
  if (!trip.value) return;
  isSubmitting.value = true;
  try {
    await api.post(`/trips/${trip.value.id}/participants`, {email: inviteEmail.value});
    showInviteModal.value = false;
    inviteEmail.value = '';
    alert('Invitation envoyée !');
    await fetchTripDetails();
  } catch (e: any) {
    console.error(e);
    alert(e.response?.data?.message || 'Erreur');
  } finally {
    isSubmitting.value = false;
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
};

const formatDateRange = (start: string, end: string) => `${new Date(start).toLocaleDateString('fr-FR')} - ${new Date(end).toLocaleDateString('fr-FR')}`;

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
    'poi': 'Point d\'intérêt',
    'accommodation': 'Hébergement',
    'restaurant': 'Restauration',
    'activity': 'Activité',
    'city': 'Ville étape'
  };
  return map[type] || type;
};

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.substring(0, 2).toUpperCase() || '?';
};

onMounted(async () => {
  try {
    currentUser.value = await getMe();
  } catch (e) {
    console.error("Failed to load user", e);
  }
  fetchTripDetails();
});
</script>

<style>
@import "@/assets/styles/tripDashboardView.css";
</style>

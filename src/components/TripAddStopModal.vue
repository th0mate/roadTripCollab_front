<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import api from '../services/api';
import { useToast } from '../composables/useToast';

const toast = useToast();

const props = defineProps<{ 
  tripId: string | number; 
  initialDate: string; 
  place: any;
  participants: any[];
  expenses: any[]; 
  currentUserId: number | null;
  tripStartDate: string;
  tripEndDate: string;
  isEditing?: boolean;
}>();

const emit = defineEmits(['close', 'added']);

const isLoading = ref(false);

const extractDate = (s?: string) => {
  if (!s) return '';
  return s.substring(0, 10);
};

const extractTime = (s?: string) => { 
  if (!s) return '10:00'; 
  const p = s.split(/[T ]/); 
  if (p.length < 2) return '10:00';
  return p[1].substring(0, 5); 
};

const form = ref({
  title: '',
  type: 'activity',
  arrivalDate: '',
  departureDate: '',
  arrivalTime: '10:00',
  departureTime: '11:00',
  addExpense: false,
  amount: 0,
  category: 'activity',
  paidBy: props.currentUserId,
  existingExpenseId: null as number | null
});

onMounted(() => {
  const s = props.place?.existingStop;
  
  if (props.isEditing && s) {
    form.value.title = s.title;
    form.value.type = s.type;
    form.value.arrivalDate = extractDate(s.arrivalDate);
    form.value.departureDate = extractDate(s.departureDate || s.arrivalDate);
    form.value.arrivalTime = extractTime(s.arrivalDate);
    form.value.departureTime = extractTime(s.departureDate);
    
    if (s.price > 0) {
      form.value.addExpense = true;
      form.value.amount = Number(s.price);
      form.value.paidBy = s.paidBy || props.currentUserId;
    }

    const related = props.expenses?.find((e: any) =>
      (e.stopId === s.id || e.stop_id === s.id) || 
      (e.title === s.title && extractDate(e.expenseDate) === extractDate(s.arrivalDate))
    );
    
    if (related) {
      form.value.addExpense = true;
      form.value.amount = Number(related.amount);
      form.value.category = related.category;
      form.value.paidBy = related.paidBy;
      form.value.existingExpenseId = related.id;
    }
  } else {
    form.value.title = props.place?.name || '';
    form.value.arrivalDate = props.initialDate || props.tripStartDate.substring(0, 10);
    form.value.departureDate = form.value.arrivalDate;
    form.value.paidBy = props.currentUserId;
    
    if (props.place?.types) {
      if (props.place.types.includes('lodging')) form.value.type = 'accommodation';
      else if (props.place.types.includes('restaurant') || props.place.types.includes('food')) form.value.type = 'restaurant';
      form.value.category = form.value.type;
    }
  }
});

watch(() => form.value.arrivalTime, (newTime) => {
  if (props.isEditing) return;
  const [h, m] = newTime.split(':').map(Number);
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (form.value.type !== 'accommodation') {
    form.value.departureTime = `${pad((h + 1) % 24)}:${pad(m)}`;
  }
});

const submit = async () => {
  isLoading.value = true;
  try {
    const arrivalDate = `${form.value.arrivalDate} ${form.value.arrivalTime}:00`;
    const departureDate = `${form.value.departureDate} ${form.value.departureTime}:00`;
    
    const stopData = {
      title: form.value.title,
      type: form.value.type,
      latitude: props.place.geometry?.location?.lat() || props.place.latitude,
      longitude: props.place.geometry?.location?.lng() || props.place.longitude,
      address: props.place.formatted_address || props.place.name || form.value.title,
      arrivalDate: arrivalDate,
      departureDate: departureDate,
      price: form.value.addExpense ? form.value.amount : 0,
      paidBy: form.value.addExpense ? form.value.paidBy : null
    };

    if (props.isEditing && props.place.existingStop?.id) {
      const stopId = props.place.existingStop.id;
      await api.patch(`/stops/${stopId}`, stopData);
      
      const expenseData = {
        tripId: props.tripId,
        title: form.value.title,
        amount: form.value.amount,
        category: form.value.category,
        paidBy: form.value.paidBy,
        expenseDate: arrivalDate,
        stop_id: stopId
      };

      if (form.value.addExpense) {
        if (form.value.existingExpenseId) await api.patch(`/expenses/${form.value.existingExpenseId}`, expenseData);
        else await api.post(`/trips/${props.tripId}/expenses`, expenseData);
      } else if (form.value.existingExpenseId) {
        await api.delete(`/expenses/${form.value.existingExpenseId}`);
      }
    } else {
      const stopRes = await api.post(`/trips/${props.tripId}/stops`, stopData);
      const newStopId = stopRes.data.id;

      if (form.value.addExpense && form.value.amount > 0) {
        await api.post(`/trips/${props.tripId}/expenses`, {
          tripId: props.tripId,
          title: form.value.title,
          amount: form.value.amount,
          category: form.value.category,
          paidBy: form.value.paidBy,
          expenseDate: arrivalDate,
          stop_id: newStopId
        });
      }
    }

    toast.success(props.isEditing ? `"${form.value.title}" mis à jour !` : `"${form.value.title}" ajouté au voyage !`)
    emit('added');
    emit('close');
  } catch (e) { toast.error("Erreur lors de l'enregistrement."); }
  finally { isLoading.value = false; }
};
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-fade-in" @click.self="$emit('close')">
    <div class="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col animate-slide-up">
      <header class="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-primary-400/10 flex items-center justify-center text-primary-500">
            <i :class="isEditing ? 'fi fi-rr-edit' : 'fi fi-rr-map-marker-plus'" class="text-lg"></i>
          </div>
          <h3 class="text-xl font-black text-zinc-900 dark:text-zinc-100">{{ isEditing ? 'Modifier l\'étape' : 'Ajouter au voyage' }}</h3>
        </div>
        <button @click="$emit('close')" class="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer">
          <i class="fi fi-rr-cross-small text-xl"></i>
        </button>
      </header>

      <div class="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
        <div class="p-5 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/5 rounded-3xl">
          <p class="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">Lieu sélectionné</p>
          <div class="space-y-1">
            <input v-model="form.title" class="w-full bg-transparent border-none p-0 font-black text-base text-zinc-900 dark:text-zinc-100 leading-tight focus:ring-0" placeholder="Titre de l'étape" />
            <p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-1">{{ place?.formatted_address || place?.address }}</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest ml-1">Arrivée</label>
              <div class="flex flex-col gap-2">
                <input type="date" v-model="form.arrivalDate" :min="tripStartDate.substring(0,10)" :max="tripEndDate.substring(0,10)" class="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all" />
                <input type="time" v-model="form.arrivalTime" class="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all" />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest ml-1">Départ</label>
              <div class="flex flex-col gap-2">
                <input type="date" v-model="form.departureDate" :min="form.arrivalDate" :max="tripEndDate.substring(0,10)" class="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all" />
                <input type="time" v-model="form.departureTime" class="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all" />
              </div>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest ml-1">Type d'étape</label>
            <select v-model="form.type" class="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all">
              <option value="activity">Activité</option>
              <option value="restaurant">Restaurant</option>
              <option value="accommodation">Hébergement</option>
              <option value="city">Ville / Escale</option>
              <option value="poi">Point d'intérêt</option>
            </select>
          </div>
        </div>

        <div class="pt-2">
          <button @click="form.addExpense = !form.addExpense" 
            class="w-full p-4 rounded-2xl border transition-all flex items-center justify-between group"
            :class="form.addExpense ? 'bg-primary-400/5 border-primary-400/30' : 'bg-zinc-50 dark:bg-white/5 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700'">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center transition-all" :class="form.addExpense ? 'bg-primary-400 text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'">
                <i class="fi fi-rr-receipt text-sm"></i>
              </div>
              <div class="text-left">
                <p class="text-xs font-black text-zinc-900 dark:text-zinc-100">Dépense associée</p>
                <p class="text-[10px] text-zinc-500 dark:text-zinc-400">{{ form.existingExpenseId ? 'Modifier la dépense liée' : 'Ajouter automatiquement au budget' }}</p>
              </div>
            </div>
            <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all" :class="form.addExpense ? 'bg-primary-400 border-primary-400' : 'border-zinc-300 dark:border-zinc-600'">
              <i v-if="form.addExpense" class="fi fi-rr-check text-[10px] text-zinc-900 font-bold"></i>
            </div>
          </button>

          <div v-if="form.addExpense" class="mt-4 p-6 bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 rounded-3xl space-y-4 animate-fade-in">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest">Montant (€)</label>
                <input type="number" v-model="form.amount" min="0" step="0.01" class="w-full bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest">Catégorie</label>
                  <select v-model="form.category" class="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 rounded-xl px-4 py-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all">
                    <option value="activity">Activité</option>
                    <option value="food">Nourriture</option>
                    <option value="accommodation">Logement</option>
                    <option value="transport">Transport</option>
                    <option value="other">Autre</option>
                  </select>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest">Payé par</label>
              <select v-model="form.paidBy" class="w-full bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none">
                <option v-for="p in participants" :key="p.id" :value="p.id">{{ p.id === currentUserId ? 'Moi' : p.fullName }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="px-8 py-6 bg-zinc-50 dark:bg-white/[0.02] border-t border-zinc-100 dark:border-zinc-800/50 flex gap-3">
        <button @click="$emit('close')" class="btn-secondary flex-1 !py-4">Annuler</button>
        <button @click="submit" :disabled="isLoading" class="btn-primary flex-[2] !py-4 shadow-xl shadow-primary-400/20">
          <span v-if="isLoading" class="spinner w-5 h-5"></span>
          <span v-else class="flex items-center justify-center gap-2"><i class="fi fi-rr-check"></i>{{ isEditing ? 'Enregistrer les modifications' : 'Confirmer l\'ajout' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
</style>

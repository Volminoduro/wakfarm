<template>
  <!-- Rift (Brèche) Configuration -->
  <div v-if="run.isRift" class="px-4 py-2 border-t border-wakfu-gray flex items-center bg-secondary">
    <div class="flex items-center gap-2 flex-1">
      <!-- Booster -->
      <div class="flex justify-center w-15">
        <input 
          type="checkbox"
          :checked="run.isBooster"
          @change="updateField('isBooster', $event.target.checked)"
          class="custom-checkbox-small"
        />
      </div>

      <!-- Vague de départ -->
      <div class="flex justify-center w-15">
        <input 
          type="number"
          :value="run.startingWave"
          @input="updateField('startingWave', Math.max(1, parseInt($event.target.value) || 1))"
          class="cf-input text-sm py-1 text-center w-15"
          min="1"
        />
      </div>

      <!-- Nombre de vagues effectuées -->
      <div class="flex justify-center w-15">
        <input 
          type="number"
          :value="run.wavesCompleted"
          @input="updateField('wavesCompleted', Math.min(99, Math.max(1, parseInt($event.target.value) || 1)))"
          class="cf-input text-sm py-1 text-center w-15"
          min="1"
          max="99"
        />
      </div>

      <!-- Empty spacers to align with dungeon layout (Stasis, Stèles, Stèles Interv.) -->
      <div class="w-7.5"></div>

      <!-- Temps (minutes) -->
      <div class="flex justify-center w-15">
        <input 
          type="number"
          :value="run.time"
          @input="updateField('time', $event.target.value ? Math.max(1, parseInt($event.target.value)) : null)"
          :placeholder="'min'"
          class="cf-input text-sm py-1 text-center w-12.5"
          min="1"
        />
      </div>
    </div>

    <!-- Bouton supprimer -->
    <div class="flex justify-center w-15">
      <button 
        @click="emit('remove')"
        :class="['px-1 py-1 rounded text-sm transition-colors', 'bg-red-900/50 hover:bg-red-800 text-red-200']"
        :title="$t('divers.button_remove') || 'Supprimer'">
        ✕
      </button>
    </div>
  </div>

  <!-- Dungeon Configuration -->
  <div v-else class="px-2 py-3 border-t border-wakfu-gray flex items-center bg-secondary">
    <div class="flex items-center gap-2 flex-1">
      <!-- Modulé -->
      <div class="flex justify-center w-15">
        <input 
          type="checkbox" 
          :checked="run.isModulated"
          @change="updateField('isModulated', $event.target.checked)"
          class="custom-checkbox-small"
        />
      </div>

      <!-- Booster -->
      <div class="flex justify-center w-15">
        <input 
          type="checkbox" 
          :checked="run.isBooster"
          @change="updateField('isBooster', $event.target.checked)"
          class="custom-checkbox-small"
        />
      </div>

      <!-- Stasis -->
      <div class="flex justify-center w-15">
        <select 
          :value="run.stasis"
          @change="updateField('stasis', parseInt($event.target.value))"
          class="cf-select-sm text-sm w-12.5">
          <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>

      <!-- Stèles -->
      <div class="flex justify-center w-15">
        <select 
          :value="run.steles"
          @change="updateField('steles', parseInt($event.target.value))"
          class="cf-select-sm text-sm w-12.5">
          <option v-for="n in 5" :key="n - 1" :value="n - 1">{{ n - 1 }}</option>
        </select>
      </div>

      <!-- Stèles Interv. -->
      <div class="flex justify-center w-20">
        <select 
          :value="run.steleIntervention"
          @change="updateField('steleIntervention', parseInt($event.target.value))"
          class="cf-select-sm text-sm w-12.5">
          <option v-for="n in 4" :key="n - 1" :value="n - 1">{{ n - 1 }}</option>
        </select>
      </div>

       <!-- Stèle Archi -->
      <div class="flex flex-col items-center justify-center w-15">
        <input
          type="checkbox"
          :checked="run.isSteleArchi"
          @change="updateField('isSteleArchi', $event.target.checked)"
          class="custom-checkbox-small"
        />
      </div>

      <!-- Temps (minutes) -->
      <div class="flex justify-center w-15">
        <input 
          type="number"
          :value="run.time"
          @input="updateField('time', $event.target.value ? Math.max(1, parseInt($event.target.value)) : null)"
          :placeholder="$t('divers.config_time_placeholder') || 'min'"
          class="cf-input text-sm py-1 text-center w-12.5"
          min="1"
        />
      </div>
    </div>

    <!-- Bouton supprimer -->
    <div class="flex justify-center w-15">
      <button 
        @click="emit('remove')"
        :class="['px-1 py-1 rounded text-sm transition-colors', 'bg-red-900/50 hover:bg-red-800 text-red-200']"
        :title="$t('divers.button_remove') || 'Supprimer'">
        ✕
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  run: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'remove'])

function updateField(field, value) {
  emit('update', { ...props.run, [field]: value })
}
</script>

<style scoped>
/* custom-checkbox-small moved to global src/style.css */

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  appearance: textfield;
  -moz-appearance: textfield;
}
</style>

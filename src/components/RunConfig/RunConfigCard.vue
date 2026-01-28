<template>
  <div class="cf-card">
    <!-- Header -->
    <div class="px-5 py-4 flex items-center justify-between gap-4">
      <!-- Left: Instance name (clickable to toggle) -->
      <div 
        @click="toggleExpand" 
        class="flex items-center gap-3 cursor-pointer flex-1 truncate"
        :class="{ 'opacity-50': !hasRuns }">
        
        <BossIcon :boss-id="props.instance.bossId" />

        <div class="font-bold truncate text-slate-100">
          {{ $t("instances." + props.instance.id) }} ({{ $t('divers.niveau_reduit') }} {{ props.instance.level }})
        </div>
        
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          :class="[isExpanded ? 'rotate-down' : '', 'transition-transform', 'text-slate-100']">
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
        </svg>
      </div>

      <!-- Right: Action buttons -->
      <div class="flex items-center gap-2">
        <!-- Remove all button (only show if has runs) -->
        <button 
          v-if="hasRuns"
          @click="removeAllRuns"
          :class="['px-3 py-1 rounded text-sm transition-colors', 'bg-red-900/50 hover:bg-red-800 text-red-200']"
          :title="$t('divers.runs_remove_all') || 'Supprimer tous les runs'">
          ✕ {{ $t('divers.runs_all') || 'Tous' }}
        </button>

        <!-- Add run button -->
        <button 
          @click="addRun"
          :class="['px-3 py-1 rounded text-sm font-semibold transition-colors', 'bg-green-900/50 hover:bg-green-800 text-green-200']"
          :title="$t('divers.runs_add') || 'Ajouter un run'">
          +
        </button>
      </div>
    </div>

    <!-- Runs list (expandable) -->
    <transition name="slide">
      <div v-if="isExpanded && hasRuns">
        <!-- Header row with labels - Rift -->
        <div v-if="!instance.isDungeon" class="px-4 py-2 border-t border-wakfu-gray flex items-center gap-2 bg-secondary">
          <div class="flex items-center gap-2 flex-1">
            <div class="text-xs font-semibold text-slate-300 w-15 text-center">
              {{ $t('divers.config_booster') }}
            </div>
            <div class="text-xs font-semibold text-slate-300 w-30 text-center">
              {{ $t('divers.config_wave_start') }}
            </div>
            <div class="text-xs font-semibold text-slate-300 w-30 text-center">
              {{ $t('divers.config_waves_done') }}
            </div>
            <!-- Empty spacer -->
            <div class="w-7.5"></div>
            <div class="text-xs font-semibold text-slate-300 w-15 text-center">
              {{ $t('divers.config_time') }}
            </div>
          </div>
          <div class="w-15"></div> <!-- Space for delete button -->
        </div>

        <!-- Header row with labels - Dungeon -->
        <div v-else class="px-2 py-2 border-t border-wakfu-gray flex items-center bg-secondary">
          <div class="flex items-center gap-2 flex-1">
            <div class="text-xs font-semibold text-slate-300 w-15 text-center">
              {{ $t('divers.config_modulated') }}
            </div>
            <div class="text-xs font-semibold text-slate-300 w-15 text-center">
              {{ $t('divers.config_booster') }}
            </div>
            <div class="text-xs font-semibold text-slate-300 w-15 text-center">
              {{ $t('divers.config_stasis') }}
            </div>
            <div class="text-xs font-semibold text-slate-300 w-15 text-center">
              {{ $t('divers.config_steles') }}
            </div>
            <div class="text-xs font-semibold text-slate-300 w-20 text-center">
              {{ $t('divers.config_stele_intervention') }}
            </div>
             <div class="text-xs font-semibold text-slate-300 w-15 text-center">
               {{ $t('divers.config_stele_archi') }}
             </div>
            <div class="text-xs font-semibold text-slate-300 w-15 text-center">
              {{ $t('divers.config_time') }}
            </div>
          </div>
          <div class="w-15"></div> <!-- Space for delete button -->
        </div>

        <!-- Runs rows (inlined RunConfigRow) -->
        <div v-for="run in runs" :key="run.id">
          <div v-if="run.isRift" class="px-4 py-2 border-t border-wakfu-gray flex items-center bg-secondary">
            <div class="flex items-center gap-2 flex-1 flex-wrap">
              <div class="flex justify-center w-12">
                <input
                  type="checkbox"
                  :checked="run.isBooster"
                  @change="updateRun({ ...run, isBooster: $event.target.checked })"
                  class="custom-checkbox-small"
                />
              </div>
              <div class="flex justify-center w-12">
                <input
                  type="number"
                  :value="run.startingWave"
                  @input="updateRun({ ...run, startingWave: Math.max(1, parseInt($event.target.value) || 1) })"
                  class="cf-input text-sm py-1 text-center w-12"
                  min="1"
                />
              </div>
              <div class="flex justify-center w-12">
                <input
                  type="number"
                  :value="run.wavesCompleted"
                  @input="updateRun({ ...run, wavesCompleted: Math.min(99, Math.max(1, parseInt($event.target.value) || 1)) })"
                  class="cf-input text-sm py-1 text-center w-12"
                  min="1"
                  max="99"
                />
              </div>
              <div class="w-6"></div>
              <div class="flex justify-center w-12">
                <input
                  type="number"
                  :value="run.time"
                  @input="updateRun({ ...run, time: $event.target.value ? Math.max(1, parseInt($event.target.value)) : null })"
                  :placeholder="'min'"
                  class="cf-input text-sm py-1 text-center w-12"
                  min="1"
                />
              </div>
            </div>
            <div class="flex justify-center w-12">
              <button
                @click="removeRun(run.id)"
                :class="['px-1 py-1 rounded text-sm transition-colors', 'bg-red-900/50 hover:bg-red-800 text-red-200']"
                :title="$t('divers.button_remove') || 'Supprimer'">
                ✕
              </button>
            </div>
          </div>

          <div v-else class="px-2 py-3 border-t border-wakfu-gray flex items-center bg-secondary">
            <div class="flex items-center gap-2 flex-1 flex-wrap">
              <div class="flex justify-center w-12">
                <input
                  type="checkbox"
                  :checked="run.isModulated"
                  @change="updateRun({ ...run, isModulated: $event.target.checked })"
                  class="custom-checkbox-small"
                />
              </div>
              <div class="flex justify-center w-12">
                <input
                  type="checkbox"
                  :checked="run.isBooster"
                  @change="updateRun({ ...run, isBooster: $event.target.checked })"
                  class="custom-checkbox-small"
                />
              </div>
              <div class="flex justify-center w-12">
                <select
                  :value="run.stasis"
                  @change="updateRun({ ...run, stasis: parseInt($event.target.value) })"
                  class="cf-select-sm text-sm w-12">
                  <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
                </select>
              </div>
              <div class="flex justify-center w-12">
                <select
                  :value="run.steles"
                  @change="updateRun({ ...run, steles: parseInt($event.target.value) })"
                  class="cf-select-sm text-sm w-12">
                  <option v-for="n in 5" :key="n - 1" :value="n - 1">{{ n - 1 }}</option>
                </select>
              </div>
              <div class="flex justify-center w-14">
                <select
                  :value="run.steleIntervention"
                  @change="updateRun({ ...run, steleIntervention: parseInt($event.target.value) })"
                  class="cf-select-sm text-sm w-12">
                  <option v-for="n in 4" :key="n - 1" :value="n - 1">{{ n - 1 }}</option>
                </select>
              </div>
              <div class="flex flex-col items-center justify-center w-12">
                <input
                  type="checkbox"
                  :checked="run.isSteleArchi"
                  @change="updateRun({ ...run, isSteleArchi: $event.target.checked })"
                  class="custom-checkbox-small"
                />
              </div>
              <div class="flex justify-center w-12">
                <input
                  type="number"
                  :value="run.time"
                  @input="updateRun({ ...run, time: $event.target.value ? Math.max(1, parseInt($event.target.value)) : null })"
                  :placeholder="$t('divers.config_time_placeholder') || 'min'"
                  class="cf-input text-sm py-1 text-center w-12"
                  min="1"
                />
              </div>
            </div>
            <div class="flex justify-center w-12">
              <button
                @click="removeRun(run.id)"
                :class="['px-1 py-1 rounded text-sm transition-colors', 'bg-red-900/50 hover:bg-red-800 text-red-200']"
                :title="$t('divers.button_remove') || 'Supprimer'">
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Empty state when expanded but no runs -->
    <div 
      v-if="isExpanded && !hasRuns" 
      class="px-5 py-4 text-center border-t border-wakfu-gray bg-secondary text-slate-400">
      {{ $t('divers.runs_empty') || 'Aucun run configuré. Cliquez sur "+" pour en ajouter un.' }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BossIcon from '@/components/BossIcon.vue'
import { useConfigRunStore } from '@/stores/useConfigRunStore'

const props = defineProps({
  instance: {
    type: Object,
    required: true
  }
})

const configRunStore = useConfigRunStore()

const isExpanded = computed(() => configRunStore.expandedInstances.has(props.instance.id))
const runs = computed(() => configRunStore.getRunsForInstance(props.instance.id))
const hasRuns = computed(() => runs.value.length > 0)

function toggleExpand() {
  configRunStore.toggleExpanded(props.instance.id)
}

function addRun() {
  configRunStore.addRun(props.instance.id)
  // Auto-expand when adding a run
  if (!isExpanded.value) {
    configRunStore.toggleExpanded(props.instance.id)
  }
}

function removeRun(runId) {
  configRunStore.removeRun(props.instance.id, runId)
}

function updateRun(updatedRun) {
  configRunStore.updateRun(props.instance.id, updatedRun.id, updatedRun)
}

function removeAllRuns() {
  configRunStore.removeAllRunsForInstance(props.instance.id)
}
</script>

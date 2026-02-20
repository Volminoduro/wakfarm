<template>
  <div :class="['harvest-input-wrapper', widthClass]">
    <input
      type="number"
      :value="value"
      @input="$emit('input', $event)"
      :class="['cf-input', widthClass, 'text-center', 'harvest-input-padding', inputClass]"
      :min="min"
      :max="max"
      :step="step"
      :placeholder="placeholder"
    >
    <span class="harvest-input-unit">{{ unit }}</span>
  </div>
</template>

<script setup>
defineProps({
  value: {
    type: [Number, String, null],
    default: null
  },
  unit: {
    type: String,
    required: true
  },
  min: {
    type: [Number, String],
    default: 0
  },
  max: {
    type: [Number, String],
    default: 999
  },
  step: {
    type: [Number, String],
    default: 1
  },
  placeholder: {
    type: [String, Number],
    default: ''
  },
  widthClass: {
    type: String,
    default: 'w-24'
  },
  inputClass: {
    type: String,
    default: ''
  }
})

defineEmits(['input'])
</script>

<style scoped>
.harvest-input-wrapper {
  position: relative;
  display: inline-block;
}

.harvest-input-padding {
  padding-right: 1.75rem;
}

.harvest-input-unit {
  position: absolute;
  right: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9CA3AF;
  pointer-events: none;
  font-weight: 500;
  line-height: 1;
}
</style>

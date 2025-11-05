<template>
  <div class="relative w-full overflow-auto" :style="{ height: canvasHeight + 'px' }">
    <svg :width="canvasWidth" :height="canvasHeight" class="absolute inset-0">
      <g>
        <line
          v-for="(ln, i) in links"
          :key="'ln-' + i"
          :x1="ln.x1" :y1="ln.y1" :x2="ln.x2" :y2="ln.y2"
          stroke="#CBD5E1" stroke-width="3"
        />
      </g>
    </svg>
    <div
      v-for="(n, i) in nodes"
      :key="'nd-' + i"
      class="absolute rounded-md text-sm font-semibold whitespace-nowrap select-none shadow"
      :class="[n.cls, n.kind === 'iface' ? 'cursor-pointer' : '']"
      :style="{ left: n.x - n.w/2 + 'px', top: n.y - 18 + 'px', padding: '8px 12px' }"
      @click="onNodeClick(n)"
    >
      {{ n.label }}
    </div>
  </div>

</template>

<script setup lang="ts">
import { computed } from 'vue';

type VlanStruct = { id: string | number; name: string; interfaces: string[]; rules: any[] };
type Group = { sede: string; vlans: VlanStruct[] };

const props = defineProps<{ groups: Group[] }>();
const emit = defineEmits<{
  (e: 'open-interface', payload: { sede: string; vlanId: string | number; vlanName: string; iface: string }): void
}>();

// Layout constants
const levelX = [200, 580, 980]; // sede, vlan, iface
const vgap = 52; // vertical gap between siblings
const colWidth = 380; // width available per column area

type Node = { x: number; y: number; w: number; label: string; cls: string; kind: 'sede'|'vlan'|'iface'; sede?: string; vlanId?: string|number; vlanName?: string; iface?: string };
type Link = { x1: number; y1: number; x2: number; y2: number };

function measure(text: string) {
  const len = Math.min(280, Math.max(100, text.length * 9));
  return len;
}

const { nodes, links, canvasHeight, canvasWidth } = computed(() => {
  const nodes: Node[] = [];
  const links: Link[] = [];
  let yCursor = 40;
  const groupSpacing = 40;
  const startY = 40;

  for (const g of props.groups) {
    // Pre-calc iface rows to size the group block
    const ifaceCount = g.vlans.reduce((acc, v) => acc + Math.max(1, v.interfaces.length), 0);
    const blockHeight = Math.max(vgap, ifaceCount * vgap);
    const sedeY = yCursor + blockHeight / 2;
    // Sede node
    nodes.push({ x: levelX[0], y: sedeY, w: measure(g.sede), label: g.sede, cls: 'bg-blue-600 text-white border border-blue-600', kind: 'sede' });

    // VLANs
    let vlanY = yCursor;
    for (const v of g.vlans) {
      const thisCount = Math.max(1, v.interfaces.length);
      const vlanBlockH = thisCount * vgap;
      const centerY = vlanY + vlanBlockH / 2;
      nodes.push({ x: levelX[1], y: centerY, w: measure(`VLAN ${v.id} - ${v.name}`), label: `VLAN ${v.id} - ${v.name}`, cls: 'bg-blue-300 text-white border border-blue-300', kind: 'vlan', sede: g.sede, vlanId: v.id, vlanName: v.name });
      // Always connect Sede -> VLAN
      links.push({ x1: levelX[0]+44, y1: sedeY, x2: levelX[1]-44, y2: centerY });
      // Draw interfaces only if present
      const hasIfaces = Array.isArray((v as any).interfaces) && (v as any).interfaces.length > 0;
      if (hasIfaces) {
      let iy = vlanY + vgap/2;
        for (const iface of v.interfaces) {
          nodes.push({ x: levelX[2], y: iy, w: measure(iface), label: iface, cls: 'bg-amber-500 text-white border border-amber-500', kind: 'iface', sede: g.sede, vlanId: v.id, vlanName: v.name, iface });
          links.push({ x1: levelX[1]+44, y1: centerY, x2: levelX[2]-44, y2: iy });
          iy += vgap;
        }
      }
      vlanY += vlanBlockH;
    }
    yCursor += blockHeight + groupSpacing;
  }
  const height = Math.max(240, yCursor + startY);
  const width = levelX[levelX.length-1] + colWidth;
  return { nodes, links, canvasHeight: height, canvasWidth: width };
}).value;

function onNodeClick(n: Node) {
  if (n.kind === 'iface' && n.sede && n.vlanId !== undefined && n.vlanName && typeof n.iface === 'string') {
    emit('open-interface', { sede: n.sede, vlanId: n.vlanId, vlanName: n.vlanName, iface: n.iface });
  }
}


</script>

<style scoped>
.shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
</style>







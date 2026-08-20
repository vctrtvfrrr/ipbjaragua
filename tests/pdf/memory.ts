import { readdir, readFile } from 'node:fs/promises'

// Chromium renders in its own process tree and a merge runs inside Node, so a generation is
// only measured by sampling both halves: `extra` reports what this process holds, counted from
// where it stood when the sampling began.
export function sampleMemory(extra: () => number = () => 0): { stop: () => Promise<number> } {
  const baseline = extra()
  let peak = 0
  let running = true

  const loop = (async () => {
    while (running) {
      peak = Math.max(peak, extra() - baseline + (await chromiumResidentBytes()))
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  })()

  return {
    stop: async () => {
      running = false
      await loop
      return peak
    },
  }
}

export function nodeHeldBytes(): number {
  const usage = process.memoryUsage()

  return usage.heapUsed + usage.external
}

// Chromium is a process tree that shares most of its mappings, so resident set size counts the
// same pages once per process; the proportional set size is what the container pays.
async function chromiumResidentBytes(): Promise<number> {
  let total = 0

  for (const entry of await readdir('/proc')) {
    if (!/^\d+$/.test(entry)) continue

    try {
      const command = await readFile(`/proc/${entry}/comm`, 'utf8')
      if (!/chrome|headless/i.test(command)) continue

      const rollup = await readFile(`/proc/${entry}/smaps_rollup`, 'utf8')
      total += Number(/^Pss:\s+(\d+) kB/m.exec(rollup)?.[1] ?? 0) * 1024
    } catch {
      // A process that exits between the scan and the read simply stops counting.
    }
  }

  return total
}
